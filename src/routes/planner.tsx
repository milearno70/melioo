import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, CardTitle, PaperCard } from "@/components/melio/AppShell";
import { Star, subjectBg } from "@/components/melio/decor";
import { planAssignment } from "@/lib/ai-tasks.functions";
import { actions, useStore, type Task } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({ meta: [
    { title: "AI Task Planner — MELIO" },
    { name: "description", content: "Describe an assignment and let MELIO's AI break it into organized study tasks with subjects, priorities and due dates." },
    { property: "og:title", content: "AI Task Planner — MELIO" },
    { property: "og:description", content: "Turn assignment descriptions into organized study tasks with AI." },
  ] }),
  component: Planner,
});

type Draft = { key: string; title: string; subjectId: string; priority: Task["priority"]; due: string; reason: string };
const EXAMPLE = "Database Systems group project: design an ER diagram for a library system, write the SQL schema with constraints, and prepare a 10-minute presentation. Due next Friday. Also a short English essay (800 words) on remote learning due Monday.";
const localToday = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

function Planner() {
  const subjects = useStore((s) => s.subjects);
  const plan = useServerFn(planAssignment);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  async function generate() {
    if (text.trim().length < 10) { setError("Tell me a little more about the assignment (at least 10 characters)."); return; }
    setError(null); setLoading(true); setDrafts([]);
    try {
      const res = await plan({ data: { description: text.trim(), today: localToday(), subjects: subjects.map(({ id, name }) => ({ id, name })) } });
      if (res.error) { setError(res.error); return; }
      setDrafts(res.tasks.map((t) => ({ ...t, key: crypto.randomUUID(), subjectId: t.subjectId ?? subjects[0]?.id ?? "" })));
    } catch {
      setError("Couldn't reach the planner. Please try again.");
    } finally { setLoading(false); }
  }

  const update = (key: string, p: Partial<Draft>) => setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...p } : x)));

  async function save() {
    const valid = drafts.filter((d) => d.title.trim());
    try { await actions.addTasks(valid.map(({ title, subjectId, priority, due }) => ({ title: title.trim(), subjectId, priority, due })));
    } catch { return; }
    toast.success(`${valid.length} tasks added to your planner ✦`);
    setDrafts([]); setText("");
  }

  return (
    <AppShell>
      <h1 className="font-hand text-5xl text-ink">AI Task Planner <Star face className="ml-1 h-9 w-9 -rotate-12 align-middle" /></h1>
      <p className="mb-6 text-muted-foreground">Describe your assignments in your own words — MELIO will turn them into bite-sized tasks.</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <PaperCard tape="lavender" className="bg-ruled">
          <CardTitle>What do you need to do?</CardTitle>
          <label htmlFor="desc" className="sr-only">Assignment description</label>
          <textarea id="desc" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} rows={9}
            placeholder="e.g. Math problem set on integrals, chapters 5–6, due Thursday…"
            className="w-full resize-y rounded-md border-2 bg-card/90 p-3 text-sm leading-7 outline-none focus:border-ink" />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <button type="button" onClick={() => setText(EXAMPLE)} className="font-semibold text-ink hover:underline">Try an example</button>
            <span>{text.length}/4000</span>
          </div>
          {error && <p role="alert" className="mt-3 rounded-sm bg-pink/60 px-3 py-2 text-sm font-semibold text-accent-foreground">{error}</p>}
          <button onClick={generate} disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 font-bold text-primary-foreground shadow-paper transition-transform hover:-translate-y-0.5 disabled:opacity-60">
            <Wand2 className={cn("h-4 w-4", loading && "animate-spin")} />{loading ? "Organizing your tasks…" : "Organize with AI"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">AI-powered suggestions — review them before saving.</p>
        </PaperCard>

        <PaperCard tape="butter">
          <CardTitle aside={drafts.length > 0 && <span className="font-hand text-base text-muted-foreground">{drafts.length} suggestions</span>}>Suggested tasks</CardTitle>
          {loading ? (
            <ul className="space-y-3" aria-busy>{[0, 1, 2].map((i) => <li key={i} className="h-16 animate-pulse rounded-sm bg-muted" />)}</ul>
          ) : drafts.length === 0 ? (
            <div className="py-10 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-ink" />
              <p className="mt-2 font-hand text-xl text-muted-foreground">Your organized tasks will appear here.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {drafts.map((d) => {
                  const sub = subjects.find((s) => s.id === d.subjectId);
                  return (
                    <li key={d.key} className="animate-pop rounded-sm border border-dashed bg-card p-3">
                      <div className="flex items-start gap-2">
                        <span className={cn("mt-2 h-3 w-3 shrink-0 rounded-full border", sub && subjectBg[sub.color])} aria-hidden />
                        <input value={d.title} onChange={(e) => update(d.key, { title: e.target.value })} aria-label="Task title" maxLength={120}
                          className="min-w-0 flex-1 rounded border-transparent bg-transparent px-1 py-0.5 font-semibold outline-none focus:bg-muted" />
                        <button onClick={() => setDrafts((x) => x.filter((y) => y.key !== d.key))} aria-label={`Remove ${d.title}`} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 pl-5 text-xs">
                        <select value={d.subjectId} onChange={(e) => update(d.key, { subjectId: e.target.value })} aria-label="Subject" className="rounded border bg-card px-1.5 py-1 font-semibold">
                          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select value={d.priority} onChange={(e) => update(d.key, { priority: e.target.value as Task["priority"] })} aria-label="Priority" className="rounded border bg-card px-1.5 py-1 font-semibold capitalize">
                          {(["high", "medium", "low"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input type="date" value={d.due} onChange={(e) => update(d.key, { due: e.target.value })} aria-label="Due date" className="rounded border bg-card px-1.5 py-1 font-semibold" />
                      </div>
                      {d.reason && <p className="mt-1.5 pl-5 font-hand text-base text-muted-foreground">{d.reason}</p>}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex gap-2">
                <button onClick={save} className="flex-1 rounded-md bg-primary py-2 font-bold text-primary-foreground shadow-paper hover:-translate-y-0.5 transition-transform">Add {drafts.length} tasks</button>
                <button onClick={() => setDrafts([])} className="rounded-md border bg-card px-4 py-2 font-bold hover:bg-muted">Discard</button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">Saved tasks show up on your <Link to="/" className="font-bold text-ink hover:underline">Dashboard</Link>.</p>
            </>
          )}
        </PaperCard>
      </div>
    </AppShell>
  );
}

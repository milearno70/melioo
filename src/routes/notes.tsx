import { createFileRoute } from "@tanstack/react-router";
import { Check, NotebookPen, Pin, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/melio/AppShell";
import { inputCls } from "@/components/melio/AuthNotebook";
import { DeleteDialog } from "@/components/melio/DeleteDialog";
import { Button } from "@/components/ui/button";
import { actions, useStore, type Note } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [
    { title: "Notes — MELIO" },
    { name: "description", content: "Keep your study ideas in MELIO's ruled-paper notebook, with searchable notes, tags and pinned favorites." },
    { property: "og:title", content: "Notes — MELIO" },
    { property: "og:description", content: "A personal study notebook with searchable notes, tags and pinned favorites." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Notes,
});

function Notes() {
  const notes = useStore((s) => s.notes);
  const subjects = useStore((s) => s.subjects);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const filtered = notes.filter((n) => `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  const active = selected ? notes.find((n) => n.id === selected) : filtered[0];
  const update = (p: Partial<Note>) => { if (active) actions.updateNote(active.id, p); };
  function addTag(e: React.FormEvent) {
    e.preventDefault();
    const value = tag.trim().replace(/^#+/, "");
    if (!value || !active) return;
    if (!active.tags.some((t) => t.toLowerCase() === value.toLowerCase())) update({ tags: [...active.tags, value] });
    setTag("");
  }
  function create() { setSelected(actions.createNote()); setQuery(""); setTag(""); setEditorOpen(true); }

  return <AppShell>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="font-hand text-lg text-muted-foreground">My Space / Notebook</p><h1 className="font-hand text-5xl text-ink">Notes</h1></div><Button onClick={create}><Plus />New note</Button></div>
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className={cn("min-w-0", editorOpen && "hidden lg:block")}>
        <div className="relative mb-4"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input aria-label="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes or tags…" className={cn(inputCls, "pl-9")} /></div>
        <p className="mb-3 font-hand text-lg text-muted-foreground">{filtered.length} {filtered.length === 1 ? "page" : "pages"}</p>
        <div className="space-y-3">
          {filtered.map((note) => <Button key={note.id} variant="ghost" onClick={() => { setSelected(note.id); setTag(""); setEditorOpen(true); }} aria-label={`Open ${note.title || "Untitled note"}`} aria-pressed={active?.id === note.id} className={cn("flex h-auto w-full flex-col items-start gap-2 whitespace-normal border-l-4 bg-card p-4 text-left shadow-paper", active?.id === note.id ? "border-ink bg-blue/30" : "border-transparent hover:bg-butter/40")}>
            <span className="flex w-full items-start justify-between gap-2"><span className="break-words font-hand text-xl">{note.title || "Untitled note"}</span>{note.pinned && <Pin className="mt-1 text-ink" />}</span>
            <span className="line-clamp-2 w-full break-words text-xs font-normal text-muted-foreground">{note.content || "Blank page"}</span>
            {note.tags.length > 0 && <span className="line-clamp-1 w-full text-xs text-ink">{note.tags.map((t) => `#${t}`).join("  ")}</span>}
          </Button>)}
          {filtered.length === 0 && <div className="py-8 text-center font-hand text-xl text-muted-foreground">{notes.length ? "No matching notes" : "Your notebook is waiting"}{query && <Button variant="link" className="mt-2 block w-full" onClick={() => setQuery("")}>Clear search</Button>}</div>}
        </div>
      </div>
      <div className={cn("min-w-0", !editorOpen && "hidden lg:block")}>
        <Button variant="link" onClick={() => setEditorOpen(false)} className="mb-3 px-0 lg:hidden">← All notes</Button>
        {active ? <section className="relative min-w-0 border-l-4 border-pink bg-paper shadow-paper">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed bg-card/80 px-4 py-3 sm:px-6">
            <span role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5" />Saved in this browser</span>
            <div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={active.pinned ? "Unpin note" : "Pin note"} aria-pressed={active.pinned} title={active.pinned ? "Unpin note" : "Pin note"} className={active.pinned ? "bg-butter text-ink" : ""} onClick={() => update({ pinned: !active.pinned })}><Pin /></Button><Button variant="ghost" size="icon" aria-label="Delete note" title="Delete note" onClick={() => setDeleting(active)}><Trash2 /></Button></div>
          </div>
          <div className="px-4 pt-5 sm:px-8"><input aria-label="Note title" value={active.title} maxLength={180} placeholder="Untitled note" onChange={(e) => update({ title: e.target.value })} className="w-full min-w-0 border-0 bg-transparent font-hand text-3xl text-ink outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <div className="my-4 flex flex-wrap items-center gap-2"><label htmlFor="note-subject" className="text-xs font-bold text-muted-foreground">Subject</label><select id="note-subject" className="max-w-full rounded-sm border bg-card px-2 py-1 text-sm" value={active.subjectId ?? ""} onChange={(e) => update({ subjectId: e.target.value || null })}><option value="">Personal</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <textarea aria-label="Note content" value={active.content} onChange={(e) => update({ content: e.target.value })} placeholder="A thought, an idea, a little discovery…" className="bg-ruled block min-h-[364px] w-full resize-y border-0 px-4 font-hand text-xl leading-[28px] outline-none focus-visible:ring-1 focus-visible:ring-ring sm:px-8" />
          <div className="border-t border-dashed bg-card/80 px-4 py-4 sm:px-8"><div className="mb-3 flex flex-wrap gap-2">{active.tags.map((t) => <span key={t} className="flex max-w-full items-center gap-1 rounded-sm bg-lavender px-2 text-xs"><span className="break-all">#{t}</span><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title={`Remove ${t} tag`} aria-label={`Remove ${t} tag`} onClick={() => update({ tags: active.tags.filter((x) => x !== t) })}><X /></Button></span>)}</div>
            <form onSubmit={addTag} className="flex items-center gap-2"><input aria-label="New tag" maxLength={40} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add a tag…" className={cn(inputCls, "min-w-0 flex-1")} /><Button type="submit" size="icon" variant="outline" disabled={!tag.trim()} title="Add tag" aria-label="Add tag"><Plus /></Button></form>
          </div>
        </section> : <div className="py-20 text-center"><NotebookPen className="mx-auto mb-4 h-12 w-12 text-ink" /><h2 className="font-hand text-3xl text-ink">A fresh page for your ideas</h2><Button className="mt-5" onClick={create}><Plus />New note</Button></div>}
      </div>
    </div>
    <DeleteDialog name={deleting ? deleting.title || "Untitled note" : null} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) { actions.deleteNote(deleting.id); if (selected === deleting.id) setSelected(null); } setDeleting(null); setEditorOpen(false); toast.success("Note deleted"); }} />
  </AppShell>;
}
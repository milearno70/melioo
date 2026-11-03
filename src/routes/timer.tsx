import { createFileRoute } from "@tanstack/react-router";
import { AppShell, CardTitle, PaperCard } from "@/components/melio/AppShell";
import { TimerWidget } from "@/components/melio/TimerWidget";
import { subjectBg } from "@/components/melio/decor";
import { actions, useStore, type Settings } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timer")({
  head: () => ({ meta: [
    { title: "Study Timer — MELIO" },
    { name: "description", content: "A cozy Pomodoro timer that rewards your pet with XP for every focus session." },
    { property: "og:title", content: "Study Timer — MELIO" },
    { property: "og:description", content: "A cozy Pomodoro timer that rewards your pet with XP for every focus session." },
  ] }),
  component: TimerPage,
});

function TimerPage() {
  const settings = useStore((s) => s.settings);
  const sessions = useStore((s) => s.sessions);
  const subjects = useStore((s) => s.subjects);
  const running = useStore((s) => s.timer.running);
  const recent = [...sessions].reverse().slice(0, 6);
  const fields: { k: keyof Settings; label: string; min: number; max: number }[] = [
    { k: "focus", label: "Focus (min)", min: 1, max: 90 }, { k: "short", label: "Short break", min: 1, max: 30 },
    { k: "long", label: "Long break", min: 1, max: 60 }, { k: "longEvery", label: "Long break every", min: 2, max: 8 },
  ];

  return (
    <AppShell>
      <h1 className="font-hand text-5xl text-ink">Study Timer</h1>
      <p className="mb-6 text-muted-foreground">One little session at a time. ✦</p>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PaperCard tape="blue" className="bg-grid py-10"><TimerWidget big /></PaperCard>
        <div className="space-y-6">
          <PaperCard tape="pink">
            <CardTitle>Timer settings</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              {fields.map((f) => (
                <label key={f.k} className="text-sm font-bold">{f.label}
                  <input type="number" min={f.min} max={f.max} value={settings[f.k]} disabled={running}
                    onChange={(e) => { const v = Math.max(f.min, Math.min(f.max, Number(e.target.value) || f.min)); actions.updateSettings({ [f.k]: v }); }}
                    className="mt-1 w-full rounded-md border-2 bg-card px-2 py-1.5 font-normal disabled:opacity-60" />
                </label>
              ))}
            </div>
            {running && <p className="mt-2 text-xs text-muted-foreground">Pause the timer to change settings.</p>}
          </PaperCard>
          <PaperCard className="bg-ruled">
            <CardTitle>Recent sessions</CardTitle>
            {recent.length === 0 ? <p className="font-hand text-lg text-muted-foreground">No sessions yet — your first one is waiting!</p> : (
              <ul className="space-y-2 text-sm">
                {recent.map((s) => {
                  const sub = subjects.find((x) => x.id === s.subjectId);
                  return (
                    <li key={s.id} className="flex items-center gap-2">
                      <span className={cn("h-3 w-3 rounded-full border", sub && subjectBg[sub.color])} />
                      <span className="flex-1 font-semibold">{s.mode === "focus" ? sub?.name : s.mode === "short" ? "Short break" : "Long break"}</span>
                      <span className="tabular-nums text-muted-foreground">{s.minutes} min · {new Date(s.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </PaperCard>
        </div>
      </div>
    </AppShell>
  );
}

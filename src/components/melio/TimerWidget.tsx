import { Pause, Play, RotateCcw } from "lucide-react";
import { fmt, useTimerTicker } from "@/hooks/use-timer";
import { actions, useStore, type Mode } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import { subjectBg } from "./decor";

const MODES: { id: Mode; label: string }[] = [{ id: "focus", label: "Focus" }, { id: "short", label: "Short break" }, { id: "long", label: "Long break" }];

export function TimerWidget({ big = false }: { big?: boolean }) {
  const { timer, remaining } = useTimerTicker();
  const settings = useStore((s) => s.settings);
  const subjects = useStore((s) => s.subjects);
  const total = settings[timer.mode] * 60e3;
  const pct = Math.min(1, 1 - remaining / total);
  const R = big ? 120 : 78, C = 2 * Math.PI * R, size = R * 2 + 24;
  const subject = subjects.find((s) => s.id === timer.subjectId);
  const paused = !timer.running && remaining < total;

  return (
    <div className="flex flex-col items-center">
      <div role="tablist" aria-label="Session mode" className="mb-4 flex gap-1 rounded-md bg-muted p-1">
        {MODES.map((m) => (
          <button key={m.id} role="tab" aria-selected={timer.mode === m.id} onClick={() => actions.setMode(m.id)}
            className={cn("rounded px-3 py-1 text-xs font-bold transition-colors", timer.mode === m.id ? "bg-card text-ink shadow-paper" : "text-muted-foreground hover:text-foreground")}>{m.label}</button>
        ))}
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--muted)" strokeWidth={big ? 14 : 10} strokeDasharray="2 6" />
          <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={timer.mode === "focus" ? "var(--ink)" : "oklch(0.7 0.1 160)"} strokeWidth={big ? 10 : 7}
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset 0.3s linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-round font-semibold tabular-nums text-ink", big ? "text-6xl" : "text-4xl")} aria-live="polite">{fmt(remaining)}</span>
          <span className="font-hand text-lg text-muted-foreground">{MODES.find((m) => m.id === timer.mode)?.label}{paused ? " · paused" : ""}</span>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <span className={cn("h-3 w-3 rounded-full border", subject && subjectBg[subject.color])} aria-hidden />
        <span className="sr-only">Subject</span>
        <select value={timer.subjectId} onChange={(e) => actions.setSubject(e.target.value)} disabled={timer.running}
          className="rounded-md border bg-card px-2 py-1 font-semibold disabled:opacity-60">
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      <div className="mt-4 flex gap-2">
        {timer.running ? (
          <button onClick={actions.pause} className="inline-flex items-center gap-2 rounded-md bg-butter px-5 py-2 font-bold shadow-paper hover:-translate-y-0.5 transition-transform"><Pause className="h-4 w-4" />Pause</button>
        ) : (
          <button onClick={actions.start} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 font-bold text-primary-foreground shadow-paper hover:-translate-y-0.5 transition-transform"><Play className="h-4 w-4" />{paused ? "Resume" : "Start"}</button>
        )}
        <button onClick={actions.reset} aria-label="Reset timer" className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 font-bold hover:bg-muted"><RotateCcw className="h-4 w-4" />Reset</button>
      </div>
      <p className="mt-3 font-hand text-base text-muted-foreground">
        {timer.focusCount % settings.longEvery}/{settings.longEvery} focus sessions until a long break
      </p>
    </div>
  );
}

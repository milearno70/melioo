import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChartLine, Gift, NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, CardTitle, PaperCard } from "@/components/melio/AppShell";
import { PetWidget } from "@/components/melio/PetWidget";
import { TimerWidget } from "@/components/melio/TimerWidget";
import { Heart, Star, subjectBg } from "@/components/melio/decor";
import { actions, focusMinutesToday, isToday, useStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "MELIO — Your Little Study Universe" },
    { name: "description", content: "MELIO is a cozy study desk with a Pomodoro timer, daily tasks and a virtual pet that grows as you learn." },
    { property: "og:title", content: "MELIO — Your Little Study Universe" },
    { property: "og:description", content: "A cozy study desk with a Pomodoro timer, daily tasks and a virtual pet that grows as you learn." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

const QUOTES = ["Small steps still move you forward.", "Progress, not perfection.", "Your future self says thank you.", "One page at a time is still a whole book.", "Be gentle with yourself — you're learning."];
const prioTone = { high: "bg-pink", medium: "bg-butter", low: "bg-mint" };

function Dashboard() {
  const user = useStore((s) => s.user);
  const sessions = useStore((s) => s.sessions);
  const tasks = useStore((s) => s.tasks);
  const subjects = useStore((s) => s.subjects);
  const goal = useStore((s) => s.settings.dailyGoalMin);
  const points = useStore((s) => s.points);
  const [date, setDate] = useState("");
  useEffect(() => setDate(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })), []);

  const minutes = focusMinutesToday(sessions);
  const todaySessions = sessions.filter((s) => s.mode === "focus" && new Date(s.endedAt).toDateString() === new Date().toDateString()).length;
  const pct = Math.min(100, Math.round((minutes / goal) * 100));
  const todayTasks = tasks.filter((t) => isToday(t.due));
  const upcoming = tasks.filter((t) => !isToday(t.due) && !t.done);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  return (
    <AppShell>
      {/* Welcome */}
      <div className="mb-8 grid items-end gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-hand text-lg text-muted-foreground">{date || "\u00A0"}</p>
          <h1 className="font-hand text-5xl leading-tight text-ink md:text-6xl">Hey, {user?.name.split(" ")[0] ?? "friend"}! <Star face className="ml-1 h-10 w-10 -rotate-12 align-middle" /></h1>
          <p className="text-muted-foreground">Ready to make today a little more productive?</p>
        </div>
        <div className="relative -rotate-2 bg-butter px-5 py-3 shadow-paper">
          <span className="washi -top-3 left-1/2 h-4 w-14 -translate-x-1/2 rotate-3 bg-plaid-pink" aria-hidden />
          <p className="font-script text-2xl text-foreground">"{quote}"</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pet */}
        <PaperCard tape="pink" className="bg-stripes-mint lg:col-span-2">
          <CardTitle aside={<Link to="/pet" className="text-sm font-bold text-ink hover:underline">Visit pet →</Link>}>Your study buddy</CardTitle>
          <PetWidget />
        </PaperCard>

        {/* Overview */}
        <PaperCard className="bg-ruled" rotate={0.6}>
          <CardTitle>Today's page</CardTitle>
          <div className="relative mx-auto mb-4 h-32 w-32">
            <svg viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--pink)" strokeWidth="10" strokeLinecap="round" strokeDasharray={264} strokeDashoffset={264 * (1 - pct / 100)} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center"><div><p className="font-round text-2xl font-semibold text-ink">{pct}%</p><p className="text-xs text-muted-foreground">of goal</p></div></div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-center">
            {[["Studied", `${Math.floor(minutes / 60)}h ${minutes % 60}m`], ["Sessions", todaySessions], ["Daily goal", `${goal / 60}h`], ["Tasks done", `${todayTasks.filter((t) => t.done).length}/${todayTasks.length}`]].map(([k, v]) => (
              <div key={k as string} className="rounded-sm bg-card/80 py-2"><dt className="text-xs font-bold text-muted-foreground">{k}</dt><dd className="font-round text-lg font-semibold">{v}</dd></div>
            ))}
          </dl>
        </PaperCard>

        {/* Timer */}
        <PaperCard tape="blue" className="bg-grid">
          <CardTitle aside={<Link to="/timer" className="text-sm font-bold text-ink hover:underline">Full timer →</Link>}>Pomodoro</CardTitle>
          <TimerWidget />
        </PaperCard>

        {/* Tasks */}
        <PaperCard tape="butter" className="lg:col-span-2">
          <CardTitle aside={<span className="font-hand text-base text-muted-foreground">+5 pts each</span>}>Today's tasks</CardTitle>
          {todayTasks.length === 0 ? <p className="font-hand text-lg text-muted-foreground">Nothing due today — enjoy the breathing room ♡</p> : (
            <ul className="divide-y divide-dashed">
              {todayTasks.map((t) => {
                const sub = subjects.find((s) => s.id === t.subjectId);
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <input type="checkbox" checked={t.done} onChange={() => actions.toggleTask(t.id)} aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`} className="h-5 w-5 accent-[var(--ink)]" />
                    <span className={cn("flex-1 font-semibold", t.done && "text-muted-foreground line-through")}>{t.title}</span>
                    <span className={cn("hidden rounded-sm px-2 py-0.5 text-xs font-bold sm:inline", sub && subjectBg[sub.color])}>{sub?.name}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold capitalize", prioTone[t.priority])}>{t.priority}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {upcoming.length > 0 && (
            <div className="mt-4 border-t border-dashed pt-3">
              <p className="mb-1 font-hand text-lg text-ink">Coming up</p>
              <ul className="space-y-1 text-sm">{upcoming.map((t) => <li key={t.id} className="flex justify-between"><span>{t.title}</span><span className="text-muted-foreground">{new Date(t.due).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span></li>)}</ul>
            </div>
          )}
        </PaperCard>

        {/* Quick access */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {[{ l: "My Library", i: BookOpen, c: "bg-blue", r: -1.5 }, { l: "Notes", i: NotebookPen, c: "bg-peach", r: 1 }, { l: "Study Tracking", i: ChartLine, c: "bg-mint", r: 1.2 }, { l: "Pet & Rewards", i: Gift, c: "bg-lavender", r: -1 }].map(({ l, i: Icon, c, r }) => (
            <div key={l} className={cn("relative p-4 shadow-paper", c)} style={{ transform: `rotate(${r}deg)` }}>
              <Icon className="h-6 w-6 text-ink" />
              <p className="mt-2 font-hand text-2xl">{l}</p>
              {l === "My Library" ? <Link to="/library" className="text-xs font-bold text-ink hover:underline">Open bookshelf →</Link> : l === "Notes" ? <Link to="/notes" className="text-xs font-bold text-ink hover:underline">Open notebook →</Link> : <p className="text-xs font-bold text-muted-foreground">Coming soon</p>}
            </div>
          ))}
        </div>

        {/* Motivation */}
        <PaperCard className="bg-plaid">
          <div className="bg-card/90 p-4">
            <CardTitle>Little wins</CardTitle>
            <p className="font-round text-3xl font-semibold text-ink">{points} <span className="text-base text-muted-foreground">points</span></p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex items-center gap-2"><Heart className="h-4 w-4" />{todaySessions > 0 ? `${todaySessions} focus session${todaySessions > 1 ? "s" : ""} today` : "Start your first session today"}</li>
              <li className="flex items-center gap-2"><Heart className="h-4 w-4" />{pct >= 100 ? "Daily goal complete!" : `${goal - minutes} min to your daily goal`}</li>
            </ul>
          </div>
        </PaperCard>
      </div>
      <p className="mt-10 text-center text-xs text-muted-foreground">Prototype mode · sample data is stored only in this browser.</p>
    </AppShell>
  );
}

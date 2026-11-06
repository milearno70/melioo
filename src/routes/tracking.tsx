import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChartColumn, Clock, Flame, Timer } from "lucide-react";
import { AppShell } from "@/components/melio/AppShell";
import { subjectBg } from "@/components/melio/decor";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/mock/store";
import { studyDays } from "@/lib/study-summary";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tracking")({ head: () => ({ meta: [
  { title: "Study Tracking — MELIO" }, { name: "description", content: "See your saved focus sessions, daily study time and progress by subject in MELIO." },
  { property: "og:title", content: "Study Tracking — MELIO" }, { property: "og:description", content: "Your study habits and focus sessions, one day at a time." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: Tracking });
function Tracking() {
  const sessions = useStore((s) => s.sessions), subjects = useStore((s) => s.subjects), goal = useStore((s) => s.settings.dailyGoalMin);
  const [range,setRange] = useState(7), [subject,setSubject] = useState("");
  const filtered = sessions.filter((s) => !subject || s.subjectId === subject);
  const days = studyDays(filtered, range), max = Math.max(goal,...days.map((d) => d.minutes));
  const start = days[0]?.key ?? "";
  const recent = filtered.filter((s) => new Date(s.endedAt).toISOString().slice(0,10) >= start).sort((a,b) => b.endedAt-a.endedAt);
  const focus = recent.filter((s) => s.mode === "focus"), minutes = focus.reduce((sum,s) => sum+s.minutes,0);
  return <AppShell>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="font-hand text-lg text-muted-foreground">Main / Your progress</p><h1 className="font-hand text-5xl text-ink">Study Tracking</h1></div><Button asChild><Link to="/timer"><Timer />Study now</Link></Button></div>
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-y border-dashed py-4"><div className="flex gap-1" role="group" aria-label="Time range">{[7,30].map((d) => <Button key={d} variant={range===d ? "secondary" : "ghost"} aria-pressed={range===d} onClick={() => setRange(d)}>{d} days</Button>)}</div><select aria-label="Study subject filter" className="max-w-full rounded-md border bg-card px-3 py-2 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">All subjects</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    <dl className="mb-8 grid grid-cols-2 gap-5 border-b border-dashed pb-6 md:grid-cols-4">{[{label:"Study time",value:`${Math.floor(minutes/60)}h ${minutes%60}m`,icon:Clock},{label:"Focus sessions",value:focus.length,icon:Timer},{label:"Active days",value:days.filter((d) => d.count).length,icon:Flame},{label:"Daily goal",value:`${goal} min`,icon:ChartColumn}].map(({label,value,icon:Icon}) => <div key={label}><dt className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><Icon className="h-4 w-4" />{label}</dt><dd className="mt-2 font-round text-2xl text-ink">{value}</dd></div>)}</dl>
    <section className="mb-10"><div className="mb-5 flex flex-wrap justify-between gap-2"><h2 className="font-hand text-3xl text-ink">One day at a time</h2><span className="text-xs text-muted-foreground">Daily totals · UTC</span></div><div className="overflow-x-auto"><div className={cn("flex h-56 items-end gap-3 border-b border-dashed",range===30 && "min-w-[900px]")}>{days.map((d) => <div key={d.key} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"><span className="mb-2 text-xs text-muted-foreground">{d.minutes || "–"}</span><div className="relative h-40 bg-blue/30"><div className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-t-sm bg-ink" style={{transform:`scaleY(${d.minutes/max})`}} title={`${d.key}: ${d.minutes} min`} /></div><span className="mt-2 pb-2 text-xs">{range===7 ? d.label : d.key.slice(8)}</span></div>)}</div></div></section>
    <div className="grid gap-8 lg:grid-cols-2"><section><h2 className="mb-5 font-hand text-3xl text-ink">By subject</h2><div className="space-y-4">{subjects.filter((s) => !subject || s.id===subject).map((s) => {const total=focus.filter((f) => f.subjectId===s.id).reduce((sum,f) => sum+f.minutes,0);return <div key={s.id}><div className="mb-2 flex justify-between text-sm"><span>{s.name}</span><span className="text-muted-foreground">{total} min</span></div><div className="h-2 overflow-hidden bg-muted"><div className={cn("h-full origin-left",subjectBg[s.color])} style={{transform:`scaleX(${minutes ? total/minutes : 0})`}} /></div></div>;})}</div></section><section><h2 className="mb-5 font-hand text-3xl text-ink">Session journal</h2>{!recent.length ? <p className="font-hand text-xl text-muted-foreground">Your first focus session is waiting.</p> : <ul className="max-h-96 divide-y divide-dashed overflow-y-auto">{recent.map((s) => <li key={s.id} className="flex justify-between gap-3 py-3 text-sm"><div><p className="font-bold">{s.mode==='focus' ? subjects.find((sub) => sub.id===s.subjectId)?.name : s.mode==='short' ? 'Short break' : 'Long break'}</p><time className="text-xs text-muted-foreground">{new Date(s.endedAt).toLocaleString()}</time></div><span className="shrink-0 text-ink">{s.minutes} min</span></li>)}</ul>}</section></div>
  </AppShell>;
}
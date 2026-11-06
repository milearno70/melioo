import type { Session } from "@/lib/mock/store";
export function studyDays(sessions: Session[], days: number, now = Date.now()) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now); date.setUTCHours(0,0,0,0); date.setUTCDate(date.getUTCDate() - days + i + 1);
    const key = date.toISOString().slice(0,10);
    const focus = sessions.filter((s) => s.mode === "focus" && new Date(s.endedAt).toISOString().slice(0,10) === key);
    return { key, label: date.toLocaleDateString(undefined,{weekday:"short", timeZone:"UTC"}), minutes: focus.reduce((sum,s) => sum+s.minutes,0), count: focus.length };
  });
}
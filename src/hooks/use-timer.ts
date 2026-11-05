import { useEffect, useState } from "react";
import { toast } from "sonner";
import { actions, useStore } from "@/lib/mock/store";

/** Recomputes remaining time from the stored end timestamp — stays accurate in inactive tabs. */
export function useTimerTicker() {
  const timer = useStore((s) => s.timer);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer.running) return;
    const check = async () => {
      setNow(Date.now());
      const done = await actions.tick().catch(() => null);
      if (done) {
        if (done.mode === "focus") {
          toast.success("Focus session complete! ⭐", { description: `+${done.points} points · +${done.xp} XP for your pet${done.goalHit ? " · Daily goal reached!" : ""}` });
        } else toast("Break's over — ready for another round?");
      }
    };
    check();
    const id = setInterval(check, 250);
    document.addEventListener("visibilitychange", check);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", check); };
  }, [timer.running, timer.endsAt]);
  const remaining = timer.running && timer.endsAt ? Math.max(0, timer.endsAt - now) : timer.remainingMs;
  return { timer, remaining };
}

export const fmt = (ms: number) => {
  const t = Math.ceil(ms / 1000);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

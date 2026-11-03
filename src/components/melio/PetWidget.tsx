import { Apple, Moon, Sparkle } from "lucide-react";
import { useState } from "react";
import { actions, petMood, useStore, XP_PER_LEVEL } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import { PetSvg } from "./PetSvg";

const moodLabel = { happy: "Happy & content", excited: "So excited!", sleeping: "Taking a nap", tired: "A little sleepy", hungry: "Feeling peckish" };

export function Meter({ label, value, tone, max = 100 }: { label: string; value: number; tone: string; max?: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold"><span>{label}</span><span className="tabular-nums text-muted-foreground">{value}/{max}</span></div>
      <div className="h-2.5 overflow-hidden rounded-full border bg-card" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemax={max}>
        <div className={cn("h-full rounded-full transition-[width] duration-500", tone)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

export function PetWidget({ size = "md" }: { size?: "md" | "lg" }) {
  const pet = useStore((s) => s.pet);
  const [bounce, setBounce] = useState(0);
  const mood = petMood(pet);
  const act = (fn: () => void) => { fn(); setBounce((b) => b + 1); };

  return (
    <div className={cn("grid items-center gap-5", size === "lg" ? "md:grid-cols-[1fr_1fr]" : "sm:grid-cols-[auto_1fr]")}>
      <div className="relative mx-auto">
        <div className={cn("bg-grid rounded-full border-2 border-dashed", size === "lg" ? "h-72 w-72" : "h-44 w-44")} />
        <PetSvg mood={mood} accessory={pet.accessory} bounceKey={bounce} className={cn("absolute inset-0 m-auto", size === "lg" ? "h-64 w-64" : "h-40 w-40")} />
      </div>
      <div className="space-y-3">
        <div>
          <p className={cn("font-hand text-ink", size === "lg" ? "text-4xl" : "text-3xl")}>{pet.name}</p>
          <p className="text-sm text-muted-foreground">Level {pet.level} · <span className="font-semibold text-accent-foreground">{moodLabel[mood]}</span></p>
        </div>
        <Meter label="Happiness" value={pet.happiness} tone="bg-pink" />
        <Meter label="Energy" value={pet.energy} tone="bg-mint" />
        <Meter label={`XP to level ${pet.level + 1}`} value={pet.xp} max={pet.level * XP_PER_LEVEL} tone="bg-star" />
        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={() => act(actions.feed)} className="inline-flex items-center gap-1.5 rounded-md border bg-peach px-3 py-1.5 text-sm font-bold hover:-translate-y-0.5 transition-transform"><Apple className="h-4 w-4" />Feed</button>
          <button onClick={() => act(actions.play)} className="inline-flex items-center gap-1.5 rounded-md border bg-pink px-3 py-1.5 text-sm font-bold hover:-translate-y-0.5 transition-transform"><Sparkle className="h-4 w-4" />Play</button>
          <button onClick={() => act(actions.rest)} className="inline-flex items-center gap-1.5 rounded-md border bg-lavender px-3 py-1.5 text-sm font-bold hover:-translate-y-0.5 transition-transform"><Moon className="h-4 w-4" />Nap</button>
        </div>
      </div>
    </div>
  );
}

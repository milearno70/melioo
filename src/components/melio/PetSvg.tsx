import type { Pet, PetMood } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

/** Original MELIO pet: a small cloud-bunny "Melly". Drawn in pencil-ink outline. */
export function PetSvg({ mood, accessory, className, bounceKey }: { mood: PetMood; accessory: Pet["accessory"]; className?: string; bounceKey?: number }) {
  const ink = "var(--ink)";
  const eyes = {
    happy: <><path d="M76 98 q6 -7 12 0" /><path d="M112 98 q6 -7 12 0" /></>,
    excited: <><path d="M74 94 l8 6 l-8 6" /><path d="M126 94 l-8 6 l8 6" /></>,
    sleeping: <><path d="M76 100 q6 5 12 0" /><path d="M112 100 q6 5 12 0" /></>,
    tired: <><path d="M75 100 h14" /><path d="M111 100 h14" /></>,
    hungry: <><circle cx="82" cy="99" r="4.5" fill={ink} /><circle cx="118" cy="99" r="4.5" fill={ink} /></>,
  }[mood];
  const mouth = {
    happy: <path d="M94 112 q6 6 12 0" />,
    excited: <path d="M92 110 q8 12 16 0 z" fill="var(--pink)" />,
    sleeping: <circle cx="100" cy="114" r="2.5" />,
    tired: <path d="M94 115 h12" />,
    hungry: <ellipse cx="100" cy="114" rx="5" ry="6" fill="var(--pink)" />,
  }[mood];

  return (
    <svg key={bounceKey} viewBox="0 0 200 200" role="img" aria-label={`Pet looking ${mood}`}
      className={cn(mood === "sleeping" ? "animate-breathe" : bounceKey ? "animate-bounce-pet" : "animate-float", className)}>
      <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* ears */}
        <path d="M70 70 C58 30 72 18 84 26 C92 34 90 56 88 68" fill="var(--paper)" />
        <path d="M130 70 C142 30 128 18 116 26 C108 34 110 56 112 68" fill="var(--paper)" />
        <path d="M76 60 C70 40 76 32 82 36" stroke="var(--pink)" strokeWidth="5" />
        <path d="M124 60 C130 40 124 32 118 36" stroke="var(--pink)" strokeWidth="5" />
        {/* body */}
        <path d="M50 120 C40 84 66 62 100 62 C134 62 160 84 150 120 C158 150 136 168 100 168 C64 168 42 150 50 120 Z" fill="var(--paper)" />
        {/* feet */}
        <ellipse cx="78" cy="168" rx="14" ry="7" fill="var(--paper)" />
        <ellipse cx="122" cy="168" rx="14" ry="7" fill="var(--paper)" />
        {/* cheeks */}
        <ellipse cx="68" cy="112" rx="9" ry="5" fill="var(--pink)" stroke="none" />
        <ellipse cx="132" cy="112" rx="9" ry="5" fill="var(--pink)" stroke="none" />
        {eyes}
        {mouth}
        {/* belly star */}
        <path d="M100 132 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="var(--star)" strokeWidth="2" />
      </g>
      {mood === "sleeping" && <text x="148" y="58" fontFamily="var(--font-hand)" fontSize="22" fill={ink}>z z</text>}
      {mood === "hungry" && <text x="140" y="60" fontFamily="var(--font-hand)" fontSize="20" fill={ink}>...snack?</text>}
      {accessory === "bow" && (
        <g stroke={ink} strokeWidth="2.5" fill="var(--pink)"><path d="M118 62 l-14 -10 v20 z" /><path d="M118 62 l14 -10 v20 z" /><circle cx="118" cy="62" r="4" /></g>
      )}
      {accessory === "hat" && (
        <g stroke={ink} strokeWidth="2.5"><path d="M78 66 L100 22 L122 66 Z" fill="var(--lavender)" /><circle cx="100" cy="22" r="6" fill="var(--butter)" /><path d="M86 52 h28" stroke="var(--paper)" /></g>
      )}
      {accessory === "star" && (
        <path d="M100 38 l5 10 11 1 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -1z" fill="var(--star)" stroke={ink} strokeWidth="2.5" />
      )}
    </svg>
  );
}

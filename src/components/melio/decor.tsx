import { cn } from "@/lib/utils";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const s = { sm: "text-3xl", md: "text-5xl", lg: "text-7xl", xl: "text-8xl md:text-9xl" }[size];
  return <span className={cn("font-logo inline-block leading-none select-none", s, className)} aria-label="MELIO">Melio</span>;
}

export function Star({ className, face = false }: { className?: string; face?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("inline-block", className)} aria-hidden>
      <path d="M20 3l4.9 10.6 11.6 1.3-8.6 7.9 2.4 11.4L20 28.4 9.7 34.2l2.4-11.4L3.5 14.9l11.6-1.3z"
        fill="var(--star)" stroke="oklch(0.7 0.1 80)" strokeWidth="1.5" strokeLinejoin="round" />
      {face && (<><circle cx="16" cy="20" r="1.4" fill="oklch(0.35 0.05 50)" /><circle cx="24" cy="20" r="1.4" fill="oklch(0.35 0.05 50)" />
        <ellipse cx="13.5" cy="23" rx="2" ry="1.1" fill="var(--pink)" /><ellipse cx="26.5" cy="23" rx="2" ry="1.1" fill="var(--pink)" /></>)}
    </svg>
  );
}

export function Washi({ className, tone = "pink" }: { className?: string; tone?: "pink" | "blue" | "mint" | "butter" | "lavender" }) {
  const bg = { pink: "bg-plaid-pink", blue: "bg-dots-blue", mint: "bg-mint", butter: "bg-butter", lavender: "bg-lavender" }[tone];
  return <span aria-hidden className={cn("washi", bg, className)} />;
}

export function Heart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("inline-block", className)} aria-hidden>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="var(--pink)" stroke="oklch(0.65 0.1 355)" strokeWidth="1.4" />
    </svg>
  );
}

export const subjectBg: Record<string, string> = {
  blue: "bg-blue", pink: "bg-pink", mint: "bg-mint", lavender: "bg-lavender", butter: "bg-butter", peach: "bg-peach",
};

/** Scattered stars for page backgrounds (pointer-events disabled so they never block controls). */
export function StarField() {
  const pos = [["6%", "12%", -12], ["92%", "8%", 18], ["3%", "55%", 8], ["96%", "48%", -20], ["10%", "88%", 14], ["88%", "90%", -6], ["50%", "4%", 10]] as const;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0">
      {pos.map(([l, t, r], i) => (
        <span key={i} className="absolute animate-float opacity-70" style={{ left: l, top: t, ["--r" as string]: `${r}deg`, animationDelay: `${i * 0.6}s` }}>
          <Star className="h-5 w-5" />
        </span>
      ))}
    </div>
  );
}

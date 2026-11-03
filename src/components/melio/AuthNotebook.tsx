import type { ReactNode } from "react";
import { Logo, Star } from "./decor";

/** Collage composition from the reference: dotted blue side borders, scattered patterned papers, ruled notebook card. */
export function AuthNotebook({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-dots-blue absolute inset-y-0 left-0 hidden w-16 md:block lg:w-24" aria-hidden />
      <div className="bg-dots-blue absolute inset-y-0 right-0 hidden w-16 md:block lg:w-24" aria-hidden />
      {[["8%", "10%"], ["90%", "14%"], ["14%", "80%"], ["84%", "78%"], ["50%", "4%"], ["20%", "45%"], ["78%", "45%"]].map(([l, t], i) => (
        <span key={i} className="pointer-events-none absolute animate-float opacity-80" style={{ left: l, top: t, animationDelay: `${i * 0.5}s` }} aria-hidden>
          <Star className="h-5 w-5" />
        </span>
      ))}

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 md:px-28 lg:grid-cols-2">
        {/* Paper collage */}
        <div className="relative mx-auto hidden h-[480px] w-full max-w-md lg:block" aria-hidden>
          <div className="bg-plaid absolute left-2 top-4 h-64 w-56 -rotate-6 shadow-paper" />
          <div className="bg-plaid-pink absolute right-0 top-0 h-60 w-60 rotate-6 opacity-80 shadow-paper" />
          <div className="bg-stripes-peach absolute bottom-6 left-6 h-72 w-60 -rotate-3 shadow-paper" />
          <div className="bg-stripes-mint absolute bottom-0 right-4 h-72 w-56 rotate-[8deg] shadow-paper" />
          <div className="bg-ruled absolute left-1/2 top-1/2 flex h-56 w-80 -translate-x-1/2 -translate-y-1/2 -rotate-1 flex-col items-center justify-center shadow-lift torn-bottom">
            <span className="washi -top-2 right-6 rotate-6 bg-plaid-pink" />
            <Logo size="lg" />
            <p className="mt-2 font-script text-2xl text-ink">Little Body, Big Heart.</p>
          </div>
          <Star face className="absolute bottom-24 left-10 h-16 w-16 -rotate-12" />
        </div>

        {/* Form notebook */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 translate-x-2 translate-y-2 rotate-1 rounded-sm bg-lavender" aria-hidden />
          <div className="bg-ruled relative rounded-sm px-8 pb-8 pt-10 shadow-lift">
            <span className="washi -top-3 left-8 -rotate-3 bg-dots-blue" aria-hidden />
            <div className="absolute left-3 top-6 bottom-6 flex flex-col justify-between" aria-hidden>
              {Array.from({ length: 10 }).map((_, i) => <span key={i} className="h-2.5 w-2.5 rounded-full border border-border bg-background" />)}
            </div>
            <div className="mb-6 text-center lg:hidden"><Logo size="md" /><p className="font-script text-xl text-ink">Little Body, Big Heart.</p></div>
            {children}
          </div>
          <p className="mt-6 text-center font-hand text-lg text-muted-foreground">Your Little Study Universe ✦</p>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, error, children, id }: { label: string; error?: string; children: ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">{label}</label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

export const inputCls = "w-full rounded-md border-2 bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ink aria-invalid:border-destructive";

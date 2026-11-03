import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, ChartLine, ChevronsLeft, ChevronsRight, Gift, Home, ListTodo, LogOut, Menu, NotebookPen, PawPrint, Settings, Sparkles, Timer, Trophy, X } from "lucide-react";
import { actions, useStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import { Logo, Star, StarField } from "./decor";

type Item = { label: string; icon: typeof Home; to?: "/" | "/timer" | "/pet"; soon?: boolean };
const NAV: { title: string; items: Item[] }[] = [
  { title: "Main", items: [{ label: "Dashboard", icon: Home, to: "/" }, { label: "Study Timer", icon: Timer, to: "/timer" }, { label: "Tasks", icon: ListTodo, soon: true }, { label: "Study Tracking", icon: ChartLine, soon: true }] },
  { title: "My Space", items: [{ label: "My Library", icon: BookOpen, soon: true }, { label: "Notes", icon: NotebookPen, soon: true }, { label: "My Pet", icon: PawPrint, to: "/pet" }] },
  { title: "Rewards", items: [{ label: "Reward Shop", icon: Gift, soon: true }, { label: "Achievements", icon: Trophy, soon: true }] },
  { title: "Other", items: [{ label: "AI Assistant", icon: Sparkles, soon: true }, { label: "Settings", icon: Settings, soon: true }] },
];

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
      {NAV.map((g) => (
        <div key={g.title}>
          {!collapsed && <p className="mb-1 px-2 font-hand text-sm uppercase tracking-widest text-muted-foreground">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const Icon = it.icon;
              const inner = (
                <>
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{it.label}</span>}
                  {!collapsed && it.soon && <span className="rounded-sm bg-butter px-1.5 font-hand text-xs text-foreground/70">soon</span>}
                </>
              );
              const base = cn("flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-semibold transition-colors", collapsed && "justify-center");
              return (
                <li key={it.label}>
                  {it.to ? (
                    <Link to={it.to} onClick={onNavigate} title={it.label}
                      className={cn(base, "hover:bg-sidebar-accent/60")}
                      activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground shadow-paper" }}
                      activeOptions={{ exact: true }}>{inner}</Link>
                  ) : (
                    <span aria-disabled title={`${it.label} — coming soon`} className={cn(base, "cursor-not-allowed text-muted-foreground/70")}>{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => { if (ready && !user) navigate({ to: "/login" }); }, [ready, user, navigate]);

  const footer = (c: boolean) => (
    <div className="border-t border-dashed px-3 py-3">
      <button onClick={() => { actions.logout(); navigate({ to: "/login" }); }}
        className={cn("flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted", c && "justify-center")}>
        <LogOut className="h-[18px] w-[18px]" />{!c && "Log out"}
      </button>
    </div>
  );

  return (
    <div className="relative flex min-h-screen">
      <StarField />
      {/* Desktop sidebar */}
      <aside className={cn("sticky top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-dashed bg-sidebar transition-[width] lg:flex", collapsed ? "w-[76px]" : "w-64")}>
        <div className="bg-dots-blue absolute inset-y-0 right-0 w-1.5 opacity-80" aria-hidden />
        <div className={cn("flex items-center px-4 pt-5 pb-4", collapsed ? "justify-center" : "justify-between")}>
          {collapsed ? <Star face className="h-9 w-9" /> : (
            <div><Logo size="sm" /><p className="font-script text-base text-muted-foreground -mt-1">Little Body, Big Heart.</p></div>
          )}
        </div>
        <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-8 z-10 grid h-6 w-6 place-items-center rounded-full border bg-card shadow-paper hover:bg-muted">
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
        <NavList collapsed={collapsed} />
        {footer(collapsed)}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-dashed bg-sidebar/95 px-4 py-2 backdrop-blur lg:hidden">
          <Logo size="sm" />
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2 hover:bg-muted"><Menu className="h-5 w-5" /></button>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
            <div className="absolute inset-0 bg-foreground/20" onClick={() => setOpen(false)} />
            <aside className="relative flex h-full w-72 flex-col bg-sidebar shadow-lift animate-in slide-in-from-left">
              <div className="flex items-center justify-between px-4 py-4"><Logo size="sm" />
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
              <NavList collapsed={false} onNavigate={() => setOpen(false)} />
              {footer(false)}
            </aside>
          </div>
        )}
        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8 animate-in fade-in duration-300">{children}</main>
      </div>
    </div>
  );
}

export function PaperCard({ children, className, tape, rotate = 0 }: { children: ReactNode; className?: string; tape?: "pink" | "blue" | "mint" | "butter" | "lavender"; rotate?: number }) {
  const tapeBg = { pink: "bg-plaid-pink", blue: "bg-dots-blue", mint: "bg-mint", butter: "bg-butter", lavender: "bg-lavender" };
  return (
    <section className={cn("paper relative p-5", className)} style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}>
      {tape && <span aria-hidden className={cn("washi -top-2.5 left-1/2 -translate-x-1/2 -rotate-2", tapeBg[tape])} />}
      {children}
    </section>
  );
}

export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-hand text-2xl text-ink">{children}</h2>
      {aside}
    </div>
  );
}

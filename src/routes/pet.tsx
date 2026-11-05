import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, CardTitle, PaperCard } from "@/components/melio/AppShell";
import { PetWidget } from "@/components/melio/PetWidget";
import { actions, RULES, useStore, type Pet } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pet")({
  head: () => ({ meta: [
    { title: "My Pet — MELIO" },
    { name: "description", content: "Care for your study buddy: feed, play, rename and dress up your MELIO pet." },
    { property: "og:title", content: "My Pet — MELIO" },
    { property: "og:description", content: "Care for your study buddy: feed, play, rename and dress up your MELIO pet." },
  ] }),
  component: PetPage,
});

const ACCESSORIES: { id: Pet["accessory"]; label: string }[] = [{ id: "none", label: "None" }, { id: "bow", label: "Pink bow" }, { id: "hat", label: "Party hat" }, { id: "star", label: "Star clip" }];

function PetPage() {
  const pet = useStore((s) => s.pet);
  const [name, setName] = useState("");

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 1 || n.length > 20) { toast.error("Names should be 1–20 characters"); return; }
    try { await actions.renamePet(n); } catch { return; } setName(""); toast.success(`Say hi to ${n}!`);
  }

  return (
    <AppShell>
      <h1 className="font-hand text-5xl text-ink">My Pet</h1>
      <p className="mb-6 text-muted-foreground">Your study buddy grows a little every time you focus.</p>
      <PaperCard tape="pink" className="bg-stripes-mint py-8"><PetWidget size="lg" /></PaperCard>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <PaperCard className="bg-ruled">
          <CardTitle>Rename</CardTitle>
          <form onSubmit={rename} className="flex gap-2">
            <label htmlFor="petname" className="sr-only">New name</label>
            <input id="petname" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={pet.name}
              className="min-w-0 flex-1 rounded-md border-2 bg-card px-3 py-1.5 text-sm" />
            <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">Save</button>
          </form>
        </PaperCard>
        <PaperCard tape="lavender">
          <CardTitle>Accessories</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            {ACCESSORIES.map((a) => (
              <button key={a.id} onClick={() => actions.setAccessory(a.id)} aria-pressed={pet.accessory === a.id}
                className={cn("rounded-md border-2 px-2 py-2 text-sm font-bold transition-colors", pet.accessory === a.id ? "border-ink bg-blue" : "bg-card hover:bg-muted")}>{a.label}</button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">More outfits, backgrounds & pet types — coming soon.</p>
        </PaperCard>
        <PaperCard tape="butter" className="bg-plaid-pink/0">
          <CardTitle>How your pet grows</CardTitle>
          <ul className="space-y-1.5 text-sm">
            <li>✦ Focus session: <b>+{RULES.focusXp} XP</b>, +{RULES.focusPoints} pts</li>
            <li>✦ Daily goal reached: <b>+{RULES.goalBonusXp} XP</b> bonus</li>
            <li>✦ Task completed: +{RULES.taskPoints} pts</li>
            <li className="pt-1 font-hand text-base text-muted-foreground">Missed a day? No worries — your pet never loses progress. ♡</li>
          </ul>
        </PaperCard>
      </div>
    </AppShell>
  );
}

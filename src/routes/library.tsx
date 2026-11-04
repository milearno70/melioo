import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Check, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/melio/AppShell";
import { Field, inputCls } from "@/components/melio/AuthNotebook";
import { DeleteDialog } from "@/components/melio/DeleteDialog";
import { Star } from "@/components/melio/decor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { actions, useStore, type Book, type BookStatus } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [
    { title: "My Library — MELIO" },
    { name: "description", content: "Your personal pastel bookshelf: collect books and keep track of your reading in MELIO." },
    { property: "og:title", content: "My Library — MELIO" },
    { property: "og:description", content: "Collect your books and track your reading in a cozy personal bookshelf." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Library,
});

const covers: Record<string, string> = { blue: "bg-blue", pink: "bg-pink", mint: "bg-mint", lavender: "bg-lavender", butter: "bg-butter", peach: "bg-peach" };
const statuses: Record<BookStatus, string> = { want: "Want to read", reading: "Reading", done: "Finished" };
type Draft = Omit<Book, "id" | "createdAt"> & { id?: string };
const blankBook = (): Draft => ({ title: "", author: "", category: "", status: "want", progress: 0, cover: "blue", description: "" });

function Library() {
  const books = useStore((s) => s.books);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Book | null>(null);
  const categories = [...new Set(books.map((b) => b.category).filter(Boolean))].sort();
  const filtered = books.filter((b) => (!category || b.category === category) && `${b.title} ${b.author}`.toLowerCase().includes(query.trim().toLowerCase()));
  const patch = (p: Partial<Draft>) => setDraft((d) => d ? { ...d, ...p } : d);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !draft.title.trim()) return;
    actions.saveBook({ ...draft, title: draft.title.trim(), author: draft.author.trim(), category: draft.category.trim(), progress: draft.status === "done" ? 100 : draft.status === "want" ? 0 : draft.progress });
    toast.success(draft.id ? "Book updated" : "Book added to your shelf");
    setDraft(null);
  }

  return <AppShell>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div><p className="font-hand text-lg text-muted-foreground">My Space / Bookshelf</p><h1 className="font-hand text-5xl text-ink">My Library <Star className="ml-1 h-8 w-8 align-middle" /></h1></div>
      <Button onClick={() => setDraft(blankBook())}><Plus />Add book</Button>
    </div>
    <div className="mb-6 flex flex-wrap gap-3 font-hand text-lg">
      <span className="border-r pr-3">{books.length} books</span>
      <span className="text-ink">{books.filter((b) => b.status === "reading").length} reading</span>
      <span className="text-muted-foreground">{books.filter((b) => b.status === "done").length} finished</span>
    </div>
    <div className="mb-8 flex flex-col gap-3 border-y border-dashed py-4 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input aria-label="Search books" placeholder="Search title or author…" value={query} onChange={(e) => setQuery(e.target.value)} className={cn(inputCls, "pl-9")} /></div>
      <select aria-label="Filter by category" className={cn(inputCls, "sm:w-48")} value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
    </div>
    {filtered.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
      {filtered.map((book) => <article key={book.id} className="min-w-0">
        <Button variant="ghost" aria-label={`Edit ${book.title}`} onClick={() => setDraft({ ...book })} className={cn("relative flex aspect-[3/4] h-auto w-full flex-col justify-between overflow-hidden whitespace-normal rounded-r-md rounded-l-sm border border-foreground/10 px-5 py-6 text-center shadow-paper transition-transform hover:-translate-y-1", covers[book.cover] ?? covers["blue"])}>
          <span className="absolute inset-y-0 left-0 w-3 border-r border-foreground/10 bg-foreground/5" aria-hidden />
          <span className="absolute right-5 top-0 h-8 w-4 bg-card/60" aria-hidden />
          <span className="pt-5 font-hand text-xs uppercase">{book.category || "Personal collection"}</span>
          <span className="break-words font-hand text-2xl leading-tight md:text-3xl">{book.title}</span>
          <BookOpen className="!h-7 !w-7 text-ink" />
          <span className="w-full break-words text-xs font-semibold">{book.author || "Unknown author"}</span>
        </Button>
        <div className="mt-3 flex items-center justify-between gap-1"><span className="font-hand text-lg text-ink">{statuses[book.status]}</span><div className="flex shrink-0"><Button variant="ghost" size="icon" title="Edit book" aria-label={`Edit details for ${book.title}`} onClick={() => setDraft({ ...book })}><Pencil /></Button><Button variant="ghost" size="icon" title="Delete book" aria-label={`Delete ${book.title}`} onClick={() => setDeleting(book)}><Trash2 /></Button></div></div>
        <div className="mt-1 flex items-center gap-2"><div role="progressbar" aria-label={`${book.title} reading progress`} aria-valuenow={book.progress} aria-valuemin={0} aria-valuemax={100} className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/50"><div className="h-full origin-left bg-ink" style={{ transform: `scaleX(${book.progress / 100})` }} /></div><span className="text-xs text-muted-foreground">{book.progress}%</span></div>
      </article>)}
    </div> : <div className="py-16 text-center"><BookOpen className="mx-auto mb-3 h-10 w-10 text-ink" /><h2 className="font-hand text-2xl">{books.length ? "No matching books" : "A new chapter starts here"}</h2><Button className="mt-4" variant="outline" onClick={() => books.length ? (setQuery(""), setCategory("")) : setDraft(blankBook())}>{books.length ? "Clear filters" : "Add your first book"}</Button></div>}
    <Dialog open={draft !== null} onOpenChange={(open) => { if (!open) setDraft(null); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto bg-card">
        <DialogTitle className="font-hand text-3xl text-ink">{draft?.id ? "Edit book" : "Add book"}</DialogTitle>
        <DialogDescription className="sr-only">Book details and reading progress</DialogDescription>
        {draft && <form onSubmit={save} className="space-y-4">
          <Field id="book-title" label="Title"><input id="book-title" autoFocus required maxLength={180} value={draft.title} onChange={(e) => patch({ title: e.target.value })} className={inputCls} /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field id="book-author" label="Author"><input id="book-author" value={draft.author} maxLength={120} onChange={(e) => patch({ author: e.target.value })} className={inputCls} /></Field><Field id="book-category" label="Category"><input id="book-category" list="book-categories" value={draft.category} maxLength={60} onChange={(e) => patch({ category: e.target.value })} className={inputCls} /><datalist id="book-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field></div>
          <fieldset><legend className="mb-2 text-sm font-bold">Cover color</legend><div className="flex gap-2">{Object.entries(covers).map(([color, cls]) => <Button key={color} type="button" variant="outline" size="icon" title={color} aria-label={`${color} cover`} aria-pressed={draft.cover === color} onClick={() => patch({ cover: color })} className={cn(cls, "border-2", draft.cover === color && "border-ink")}>{draft.cover === color && <Check />}</Button>)}</div></fieldset>
          <Field id="book-status" label="Reading status"><select id="book-status" value={draft.status} onChange={(e) => { const status = e.target.value as BookStatus; patch({ status, progress: status === "done" ? 100 : status === "want" ? 0 : draft.progress }); }} className={inputCls}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          {draft.status === "reading" && <Field id="book-progress" label={`Progress · ${draft.progress}%`}><input id="book-progress" type="range" min={0} max={100} value={draft.progress} onChange={(e) => patch({ progress: Number(e.target.value) })} className="w-full accent-primary" /></Field>}
          <Field id="book-description" label="Personal notes"><textarea id="book-description" rows={3} maxLength={3000} value={draft.description} onChange={(e) => patch({ description: e.target.value })} className={inputCls} /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={!draft.title.trim()}>Save book</Button></div>
        </form>}
      </DialogContent>
    </Dialog>
    <DeleteDialog name={deleting?.title ?? null} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) actions.deleteBook(deleting.id); setDeleting(null); toast.success("Book deleted"); }} />
  </AppShell>;
}
/**
 * MELIO mock-data layer (prototype only).
 * Shapes mirror the planned ASP.NET Core REST API (see api-contract.ts).
 * Everything here lives in localStorage — nothing is saved to a real database,
 * and point/XP rules here will move server-side (RewardsController / PetController).
 */
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { CloudState, StudyInput, StudyResult } from "@/lib/study.functions";

export type Mode = "focus" | "short" | "long";
export type PetMood = "happy" | "sleeping" | "excited" | "tired" | "hungry";

export interface Subject { id: string; name: string; color: string }
export interface Task { id: string; title: string; subjectId: string; priority: "low" | "medium" | "high"; due: string; done: boolean }
export interface Session { id: string; subjectId: string; minutes: number; mode: Mode; endedAt: number }
export interface Pet { name: string; happiness: number; energy: number; hunger: number; xp: number; level: number; accessory: "none" | "bow" | "hat" | "star"; lastAction?: string; lastActionAt?: number }
export interface TimerState { mode: Mode; running: boolean; endsAt: number | null; remainingMs: number; subjectId: string; focusCount: number }
export interface Settings { focus: number; short: number; long: number; longEvery: number; dailyGoalMin: number }
export type BookStatus = "want" | "reading" | "done";
export interface Book { id: string; title: string; author: string; category: string; status: BookStatus; progress: number; cover: string; description: string; createdAt: number }
export interface Note { id: string; title: string; content: string; subjectId: string | null; tags: string[]; pinned: boolean; updatedAt: number }
export interface User { name: string; email: string }

export interface State {
  user: User | null;
  subjects: Subject[];
  tasks: Task[];
  sessions: Session[];
  pet: Pet;
  points: number;
  books: Book[];
  notes: Note[];
  settings: Settings;
  timer: TimerState;
}

const KEY = "melio-prototype-v1";
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const defaultSettings: Settings = { focus: 25, short: 5, long: 15, longEvery: 4, dailyGoalMin: 120 };

function seed(): State {
  const now = Date.now();
  return {
    user: null,
    subjects: [
      { id: "prog", name: "Programming", color: "blue" },
      { id: "math", name: "Mathematics", color: "pink" },
      { id: "eng", name: "English", color: "mint" },
      { id: "db", name: "Database Systems", color: "lavender" },
      { id: "net", name: "Computer Networks", color: "butter" },
    ],
    tasks: [],
    sessions: [],
    books: [
      { id: "b1", title: "Clean Code", author: "Robert C. Martin", category: "Programming", status: "reading", progress: 45, cover: "blue", description: "Reading a chapter each weekend.", createdAt: now - 5e8 },
      { id: "b2", title: "Database System Concepts", author: "Silberschatz et al.", category: "Textbook", status: "reading", progress: 20, cover: "lavender", description: "Course textbook for DB Systems.", createdAt: now - 4e8 },
      { id: "b3", title: "The Little Prince", author: "Antoine de Saint-Exupéry", category: "Fiction", status: "done", progress: 100, cover: "pink", description: "Comfort read ♡", createdAt: now - 3e8 },
      { id: "b4", title: "Calculus: Early Transcendentals", author: "James Stewart", category: "Textbook", status: "want", progress: 0, cover: "butter", description: "", createdAt: now - 2e8 },
    ],
    notes: [
      { id: "n1", title: "SQL JOIN cheat sheet", content: "INNER JOIN → only matching rows\nLEFT JOIN → all left rows + matches\nRIGHT JOIN → all right rows + matches\nFULL OUTER → everything\n\nRemember: filter in ON vs WHERE changes results for outer joins!", subjectId: "db", tags: ["sql", "exam"], pinned: true, updatedAt: now - 36e5 },
      { id: "n2", title: "Limits — key ideas", content: "lim x→a f(x) = L means f gets arbitrarily close to L.\nSqueeze theorem for sin(x)/x → 1.", subjectId: "math", tags: ["calculus"], pinned: false, updatedAt: now - 864e5 },
      { id: "n3", title: "Essay brainstorm", content: "Remote learning: flexibility vs. isolation.\nInterview two classmates?", subjectId: "eng", tags: ["ideas"], pinned: false, updatedAt: now - 2 * 864e5 },
    ],
    pet: { name: "Mochi", happiness: 78, energy: 64, hunger: 40, xp: 0, level: 1, accessory: "bow" },
    points: 0,
    settings: defaultSettings,
    timer: { mode: "focus", running: false, endsAt: null, remainingMs: 25 * 60e3, subjectId: "prog", focusCount: 0 },
  };
}

let state: State = seed();
let loaded = false;
const listeners = new Set<() => void>();
const serverState = seed();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const saved = JSON.parse(raw); state = { ...seed(), books: saved.books ?? seed().books, notes: saved.notes ?? seed().notes }; }
  } catch { /* ignore */ }
}
function set(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify({ books: state.books, notes: state.notes })); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); l(); return () => listeners.delete(l); },
    () => { load(); return sel(state); },
    () => sel(serverState),
  );
}
export const getState = () => { load(); return state; };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
export const XP_PER_LEVEL = 100;

/* ---------- Pet mood (derived) ---------- */
export function petMood(p: Pet): PetMood {
  if (p.lastActionAt && Date.now() - p.lastActionAt < 2500 && p.lastAction === "play") return "excited";
  if (p.energy < 20) return "sleeping";
  if (p.hunger > 70) return "hungry";
  if (p.energy < 40) return "tired";
  return "happy";
}

export const RULES = { focusPoints: 10, focusXp: 20, goalBonusPoints: 25, goalBonusXp: 30, taskPoints: 5 };
let transport: ((input: StudyInput) => Promise<StudyResult>) | null = null;
let completing = false;
export const connectCloud = (fn: typeof transport) => { transport = fn; };
export function hydrateCloud(data: CloudState, user: User) { set((s) => ({ ...s, ...data, user })); }
export function clearCloud() { transport = null; set((s) => ({ ...s, user: null, tasks: [], sessions: [], points: 0, pet: seed().pet, timer: seed().timer })); }
async function remote(input: StudyInput): Promise<StudyResult> {
  if (!transport) throw new Error("Your account is still opening. Please try again.");
  try { return await transport(input); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save. Please try again."); throw e; }
}
const run = (input: StudyInput) => { void remote(input).catch(() => {}); };
export const actions = {
  login(user: User) { set((s) => ({ ...s, user })); },
  logout() { clearCloud(); },
  renamePet(name: string) { return remote({ command: "renamePet", payload: { name } }); },
  setAccessory(accessory: Pet["accessory"]) { run({ command: "setAccessory", payload: { accessory } }); },
  feed() { run({ command: "feed", payload: {} }); },
  play() { run({ command: "play", payload: {} }); },
  rest() { run({ command: "rest", payload: {} }); },
  toggleTask(id: string) { run({ command: "toggleTask", payload: { id } }); },
  saveTask(task: Omit<Task, "done" | "id"> & { id?: string }) { return remote({ command: "saveTask", payload: task }); },
  deleteTask(id: string) { return remote({ command: "deleteTask", payload: { id } }); },
  saveSubject(subject: Omit<Subject, "id"> & { id?: string }) { return remote({ command: "saveSubject", payload: subject as { id?: string; name: string; color: "blue" | "pink" | "mint" | "lavender" | "butter" | "peach" } }); },
  addTasks(tasks: Omit<Task, "id" | "done">[]) { return remote({ command: "addTasks", payload: { tasks } }); },
  saveBook(b: Omit<Book, "id" | "createdAt"> & { id?: string }) {
    set((s) => b.id ? { ...s, books: s.books.map((x) => (x.id === b.id ? { ...x, ...b, id: x.id } : x)) }
      : { ...s, books: [{ ...b, id: crypto.randomUUID(), createdAt: Date.now() }, ...s.books] });
  },
  deleteBook(id: string) { set((s) => ({ ...s, books: s.books.filter((x) => x.id !== id) })); },
  createNote(): string {
    const id = crypto.randomUUID();
    set((s) => ({ ...s, notes: [{ id, title: "", content: "", subjectId: null, tags: [], pinned: false, updatedAt: Date.now() }, ...s.notes] }));
    return id;
  },
  updateNote(id: string, p: Partial<Omit<Note, "id">>) { set((s) => ({ ...s, notes: s.notes.map((n) => (n.id === id ? { ...n, ...p, updatedAt: Date.now() } : n)) })); },
  deleteNote(id: string) { set((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) })); },
  updateSettings(payload: Partial<Settings>) { run({ command: "updateSettings", payload }); },
  setMode(mode: Mode) { run({ command: "setMode", payload: { mode } }); },
  setSubject(subjectId: string) { run({ command: "setSubject", payload: { subjectId } }); },
  start() { run({ command: "start", payload: {} }); },
  pause() { run({ command: "pause", payload: {} }); },
  reset() { run({ command: "reset", payload: {} }); },
  async tick(): Promise<null | { mode: Mode; points: number; xp: number; goalHit: boolean }> {
    const s = getState();
    if (completing || !transport || !s.timer.running || !s.timer.endsAt || Date.now() < s.timer.endsAt) return null;
    completing = true;
    try { const result = await remote({ command: "tick", payload: {} });
      return result.completed && result.mode ? { mode: result.mode, points: result.points ?? 0, xp: result.xp ?? 0, goalHit: result.goalHit ?? false } : null;
    } finally { completing = false; }
  },
};

export function focusMinutesToday(sessions: Session[]) {
  const d = new Date().toDateString();
  return sessions.filter((x) => x.mode === "focus" && new Date(x.endedAt).toDateString() === d).reduce((a, x) => a + x.minutes, 0);
}
export const isToday = (iso: string) => iso === today();

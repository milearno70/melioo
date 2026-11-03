/**
 * MELIO mock-data layer (prototype only).
 * Shapes mirror the planned ASP.NET Core REST API (see api-contract.ts).
 * Everything here lives in localStorage — nothing is saved to a real database,
 * and point/XP rules here will move server-side (RewardsController / PetController).
 */
import { useSyncExternalStore } from "react";

export type Mode = "focus" | "short" | "long";
export type PetMood = "happy" | "sleeping" | "excited" | "tired" | "hungry";

export interface Subject { id: string; name: string; color: string }
export interface Task { id: string; title: string; subjectId: string; priority: "low" | "medium" | "high"; due: string; done: boolean }
export interface Session { id: string; subjectId: string; minutes: number; mode: Mode; endedAt: number }
export interface Pet { name: string; happiness: number; energy: number; hunger: number; xp: number; level: number; accessory: "none" | "bow" | "hat" | "star"; lastAction?: string; lastActionAt?: number }
export interface TimerState { mode: Mode; running: boolean; endsAt: number | null; remainingMs: number; subjectId: string; focusCount: number }
export interface Settings { focus: number; short: number; long: number; longEvery: number; dailyGoalMin: number }
export interface User { name: string; email: string }

export interface State {
  user: User | null;
  subjects: Subject[];
  tasks: Task[];
  sessions: Session[];
  pet: Pet;
  points: number;
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
    tasks: [
      { id: "t1", title: "Finish SQL joins worksheet", subjectId: "db", priority: "high", due: today(), done: false },
      { id: "t2", title: "Read chapter 4: Limits", subjectId: "math", priority: "medium", due: today(), done: true },
      { id: "t3", title: "Practice C# LINQ exercises", subjectId: "prog", priority: "medium", due: today(), done: false },
      { id: "t4", title: "Essay outline — climate", subjectId: "eng", priority: "low", due: plusDays(1), done: false },
      { id: "t5", title: "Subnetting quiz prep", subjectId: "net", priority: "high", due: plusDays(2), done: false },
    ],
    sessions: [
      { id: "s1", subjectId: "prog", minutes: 25, mode: "focus", endedAt: now - 3 * 36e5 },
      { id: "s2", subjectId: "math", minutes: 25, mode: "focus", endedAt: now - 2 * 36e5 },
    ],
    pet: { name: "Mochi", happiness: 78, energy: 64, hunger: 40, xp: 140, level: 3, accessory: "bow" },
    points: 320,
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
    if (raw) state = { ...seed(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
}
function set(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
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

/* ---------- Mock rules (will be server-side) ---------- */
export const RULES = { focusPoints: 10, focusXp: 20, goalBonusPoints: 25, goalBonusXp: 30, taskPoints: 5 };

function addXp(p: Pet, xp: number): Pet {
  let total = p.xp + xp, level = p.level;
  while (total >= level * XP_PER_LEVEL) { total -= level * XP_PER_LEVEL; level++; }
  return { ...p, xp: total, level };
}

export const actions = {
  login(user: User) { set((s) => ({ ...s, user })); },
  logout() { set((s) => ({ ...s, user: null })); },
  renamePet(name: string) { set((s) => ({ ...s, pet: { ...s.pet, name } })); },
  setAccessory(a: Pet["accessory"]) { set((s) => ({ ...s, pet: { ...s.pet, accessory: a } })); },
  feed() { set((s) => ({ ...s, pet: { ...s.pet, hunger: clamp(s.pet.hunger - 30), happiness: clamp(s.pet.happiness + 5), energy: clamp(s.pet.energy + 10), lastAction: "feed", lastActionAt: Date.now() } })); },
  play() { set((s) => ({ ...s, pet: { ...s.pet, happiness: clamp(s.pet.happiness + 12), energy: clamp(s.pet.energy - 8), hunger: clamp(s.pet.hunger + 6), lastAction: "play", lastActionAt: Date.now() } })); },
  rest() { set((s) => ({ ...s, pet: { ...s.pet, energy: clamp(s.pet.energy + 25), lastAction: "rest", lastActionAt: Date.now() } })); },
  toggleTask(id: string) {
    set((s) => {
      const t = s.tasks.find((x) => x.id === id); if (!t) return s;
      const delta = t.done ? -RULES.taskPoints : RULES.taskPoints;
      return { ...s, points: s.points + delta, tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) };
    });
  },
  addTasks(list: Omit<Task, "id" | "done">[]) {
    set((s) => ({ ...s, tasks: [...s.tasks, ...list.map((t) => ({ ...t, id: crypto.randomUUID(), done: false }))] }));
  },
  updateSettings(p: Partial<Settings>) {
    set((s) => {
      const settings = { ...s.settings, ...p };
      const timer = s.timer.running ? s.timer : { ...s.timer, remainingMs: settings[s.timer.mode] * 60e3 };
      return { ...s, settings, timer };
    });
  },
  /* Timer — accurate via timestamps, not interval counting */
  setMode(mode: Mode) { set((s) => ({ ...s, timer: { ...s.timer, mode, running: false, endsAt: null, remainingMs: s.settings[mode] * 60e3 } })); },
  setSubject(subjectId: string) { set((s) => ({ ...s, timer: { ...s.timer, subjectId } })); },
  start() { set((s) => (s.timer.running ? s : { ...s, timer: { ...s.timer, running: true, endsAt: Date.now() + s.timer.remainingMs } })); },
  pause() { set((s) => (!s.timer.running || !s.timer.endsAt ? s : { ...s, timer: { ...s.timer, running: false, remainingMs: Math.max(0, s.timer.endsAt - Date.now()), endsAt: null } })); },
  reset() { set((s) => ({ ...s, timer: { ...s.timer, running: false, endsAt: null, remainingMs: s.settings[s.timer.mode] * 60e3 } })); },
  /** Returns a summary if a session just completed. */
  tick(): null | { mode: Mode; points: number; xp: number; goalHit: boolean } {
    const s = getState();
    if (!s.timer.running || !s.timer.endsAt || Date.now() < s.timer.endsAt) return null;
    const mode = s.timer.mode;
    let points = 0, xp = 0, goalHit = false;
    set((st) => {
      const minutes = st.settings[mode];
      const session: Session = { id: crypto.randomUUID(), subjectId: st.timer.subjectId, minutes, mode, endedAt: st.timer.endsAt! };
      let pet = st.pet, focusCount = st.timer.focusCount, next: Mode = "focus";
      if (mode === "focus") {
        const before = focusMinutesToday(st.sessions);
        points = RULES.focusPoints; xp = RULES.focusXp;
        if (before < st.settings.dailyGoalMin && before + minutes >= st.settings.dailyGoalMin) {
          goalHit = true; points += RULES.goalBonusPoints; xp += RULES.goalBonusXp;
        }
        pet = addXp({ ...pet, happiness: clamp(pet.happiness + 6), energy: clamp(pet.energy - 5), hunger: clamp(pet.hunger + 5) }, xp);
        focusCount++;
        next = focusCount % st.settings.longEvery === 0 ? "long" : "short";
      }
      return {
        ...st, pet, points: st.points + points, sessions: [...st.sessions, session],
        timer: { ...st.timer, mode: next, running: false, endsAt: null, remainingMs: st.settings[next] * 60e3, focusCount },
      };
    });
    return { mode, points, xp, goalHit };
  },
};

export function focusMinutesToday(sessions: Session[]) {
  const d = new Date().toDateString();
  return sessions.filter((x) => x.mode === "focus" && new Date(x.endedAt).toDateString() === d).reduce((a, x) => a + x.minutes, 0);
}
export const isToday = (iso: string) => iso === today();

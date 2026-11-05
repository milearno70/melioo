import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { State } from "@/lib/mock/store";

const task = z.object({ id: z.string().optional(), title: z.string().trim().min(1).max(180), subjectId: z.string().min(1), priority: z.enum(["low", "medium", "high"]), due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const input = z.discriminatedUnion("command", [
  z.object({ command: z.enum(["read", "feed", "play", "rest", "start", "pause", "reset", "tick"]), payload: z.object({}).default({}) }),
  z.object({ command: z.literal("saveTask"), payload: task }),
  z.object({ command: z.enum(["toggleTask", "deleteTask"]), payload: z.object({ id: z.string() }) }),
  z.object({ command: z.literal("addTasks"), payload: z.object({ tasks: z.array(task).min(1).max(30) }) }),
  z.object({ command: z.literal("saveSubject"), payload: z.object({ id: z.string().optional(), name: z.string().trim().min(1).max(60), color: z.enum(["blue", "pink", "mint", "lavender", "butter", "peach"]) }) }),
  z.object({ command: z.literal("renamePet"), payload: z.object({ name: z.string().trim().min(1).max(20) }) }),
  z.object({ command: z.literal("setAccessory"), payload: z.object({ accessory: z.enum(["none", "bow", "hat", "star"]) }) }),
  z.object({ command: z.literal("setSubject"), payload: z.object({ subjectId: z.string() }) }),
  z.object({ command: z.literal("setMode"), payload: z.object({ mode: z.enum(["focus", "short", "long"]) }) }),
  z.object({ command: z.literal("updateSettings"), payload: z.object({ focus: z.number().int().min(1).max(90).optional(), short: z.number().int().min(1).max(30).optional(), long: z.number().int().min(1).max(60).optional(), longEvery: z.number().int().min(2).max(8).optional(), dailyGoalMin: z.number().int().min(1).max(1440).optional() }) }),
]);
export type StudyInput = z.input<typeof input>;
export type CloudState = Pick<State, "subjects" | "tasks" | "sessions" | "pet" | "points" | "settings" | "timer">;
export type StudyResult = { state: CloudState; completed?: boolean; mode?: State["timer"]["mode"]; points?: number; xp?: number; goalHit?: boolean };
export const studyCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: StudyInput) => input.parse(data))
  .handler(async ({ data, context }): Promise<StudyResult> => {
    const result = await context.supabase.rpc("study_command", { command: data.command, payload: data.payload });
    if (result.error) { console.error("Study command failed", result.error.code); throw new Error("Your change could not be saved. Please try again."); }
    return result.data as unknown as StudyResult;
  });
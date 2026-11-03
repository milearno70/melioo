import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const RUN_ID = "X-Lovable-AIG-Run-ID";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    return res;
  };
}

const schema = z.object({
  tasks: z.array(z.object({
    title: z.string(),
    subjectId: z.string().nullable(),
    priority: z.enum(["low", "medium", "high"]),
    due: z.string(),
    reason: z.string(),
  })),
});

export type PlanInput = { description: string; today: string; subjects: { id: string; name: string }[] };
export type PlannedTask = z.infer<typeof schema>["tasks"][number];
export type PlanResult = { tasks: PlannedTask[]; error: null } | { tasks: []; error: string };

export async function planTasks(input: PlanInput): Promise<PlanResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { tasks: [], error: "AI isn't configured yet." };

  const provider = createOpenAI({
    baseURL: GATEWAY, apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });

  const instructions = `You are MELIO, a gentle study planner for students. Break the student's assignment description into 2-8 small, concrete, actionable study tasks (each a short imperative title under 70 characters).
Today is ${input.today}. Due dates must be YYYY-MM-DD, on or after today, spread realistically before any deadline mentioned (final task on or before the deadline). If no deadline, spread over the next 7 days.
Subjects available (use the exact id, or null if none fits): ${input.subjects.map((s) => `${s.id}=${s.name}`).join(", ")}.
Priority: high for near deadlines or big-weight work, low for optional polish. "reason" is one short friendly sentence explaining the suggestion.`;

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      messages: [{ role: "user", content: input.description }],
      output: Output.object({ schema }),
      maxRetries: 0,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });
    const out = await result.output;
    const ids = new Set(input.subjects.map((s) => s.id));
    const tasks = out.tasks.slice(0, 8).map((t) => ({
      ...t,
      title: t.title.slice(0, 120),
      subjectId: t.subjectId && ids.has(t.subjectId) ? t.subjectId : null,
      due: /^\d{4}-\d{2}-\d{2}$/.test(t.due) && t.due >= input.today ? t.due : input.today,
    }));
    return { tasks, error: null };
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) return { tasks: [], error: "The AI couldn't organize that — try adding a bit more detail." };
    const status = (e as { statusCode?: number }).statusCode;
    console.error("planTasks failed", status, e);
    if (status === 429) return { tasks: [], error: "Lots of requests right now — please try again in a minute." };
    if (status === 402) return { tasks: [], error: "AI credits have run out for this workspace. Add credits to keep using the planner." };
    if (status === 403) return { tasks: [], error: "AI access is currently blocked for this workspace." };
    return { tasks: [], error: "Something went wrong while planning. Please try again." };
  }
}

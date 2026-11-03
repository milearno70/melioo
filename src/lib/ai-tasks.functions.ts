import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { planTasks } from "./ai-tasks.server";

const input = z.object({
  description: z.string().trim().min(10, "Describe the assignment in a bit more detail").max(4000),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subjects: z.array(z.object({ id: z.string().max(40), name: z.string().max(60) })).max(30),
});

export const planAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => planTasks(data));

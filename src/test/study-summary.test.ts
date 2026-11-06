import { describe, expect, it } from "vitest";
import { studyDays } from "@/lib/study-summary";

describe("Saved study tracking", () => {
  it("counts focus sessions but excludes breaks", () => {
    const endedAt = Date.parse("2026-11-05T12:00:00Z");
    const result = studyDays([{id:"a",subjectId:"math",minutes:25,mode:"focus",endedAt},{id:"b",subjectId:"math",minutes:5,mode:"short",endedAt}],7,endedAt);
    expect(result.at(-1)?.minutes).toBe(25);
    expect(result.at(-1)?.count).toBe(1);
  });
  it("keeps sessions outside the selected date range out of daily totals", () => {
    const result = studyDays([{id:"a",subjectId:"math",minutes:25,mode:"focus",endedAt:Date.parse("2026-10-01T00:00:00Z")}],7,Date.parse("2026-11-05T12:00:00Z"));
    expect(result.reduce((sum,d) => sum+d.minutes,0)).toBe(0);
  });
});
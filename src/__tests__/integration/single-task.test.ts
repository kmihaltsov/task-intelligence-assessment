import { describe, it, expect, beforeEach } from "vitest";
import { submitAndConsume, getTasks, getTask, patchTask, cleanDatabase } from "./helpers";

describe("Single task processing", () => {
  beforeEach(() => cleanDatabase());
  it("submits one task, consumes SSE, and verifies via GET", async () => {
    // 1. Submit
    const events = await submitAndConsume(["set up CI/CD pipeline"]);

    // 2. Verify SSE events include all pipeline steps in order
    const stepNames = events.map((e) => e.stepName);
    expect(stepNames).toContain("parse");
    expect(stepNames).toContain("categorize");
    expect(stepNames).toContain("prioritize");
    expect(stepNames).toContain("action-plan");

    // 3. Verify step ordering: parse appears before categorize, etc.
    const firstParse = stepNames.indexOf("parse");
    const firstCategorize = stepNames.indexOf("categorize");
    const firstPrioritize = stepNames.indexOf("prioritize");
    const firstActionPlan = stepNames.indexOf("action-plan");
    expect(firstParse).toBeLessThan(firstCategorize);
    expect(firstCategorize).toBeLessThan(firstPrioritize);
    expect(firstPrioritize).toBeLessThan(firstActionPlan);

    // 4. Verify status transitions exist (running → completed for each step)
    for (const step of ["parse", "categorize", "prioritize", "action-plan"]) {
      const stepEvents = events.filter((e) => e.stepName === step);
      const statuses = stepEvents.map((e) => e.status);
      expect(statuses).toContain("running");
      expect(statuses).toContain("completed");
    }

    // 5. Verify task is saved in the store (DB was wiped in beforeEach)
    const { items, total } = await getTasks({ page: 1, pageSize: 50 });
    expect(total).toBe(1);
    expect(items).toHaveLength(1);

    const task = items[0];
    expect(task.executionStatus).toBe("completed");
    expect(task.category).toBeDefined();
    expect(task.priority).toBeDefined();
    expect(task.actionPlan).toBeDefined();
    expect(task.actionPlan!.steps.length).toBeGreaterThan(0);

    // 6. Verify GET by ID
    const fetched = await getTask(task.id);
    expect(fetched.id).toBe(task.id);
    expect(fetched.title).toBeTruthy();

    // 7. Test inline edit (PATCH priority)
    const patched = await patchTask(task.id, {
      priority: { priority: "critical" },
    });
    expect(patched.priority?.priority).toBe("critical");

    // 8. Verify the patch persisted
    const refetched = await getTask(task.id);
    expect(refetched.priority?.priority).toBe("critical");
  });
});

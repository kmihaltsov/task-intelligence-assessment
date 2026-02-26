import { describe, it, expect, beforeEach } from "vitest";
import { submitAndConsume, getTasks, cleanDatabase } from "./helpers";

describe("Multi-task processing", () => {
  beforeEach(() => cleanDatabase());
  it("submits multiple tasks, verifies all are processed", async () => {
    // 1. Submit 3 tasks
    const events = await submitAndConsume([
      "set up CI/CD pipeline",
      "design login page",
      "migrate database to Postgres",
    ]);

    // 2. Verify ParseStep produced multiple tasks (SSE events reference multiple taskIds)
    const taskIds = new Set(
      events
        .filter((e) => e.taskId !== "pipeline")
        .map((e) => e.taskId),
    );
    expect(taskIds.size).toBeGreaterThanOrEqual(3);

    // 3. Verify all tasks in the store (DB was wiped in beforeEach)
    const { items, total } = await getTasks({ page: 1, pageSize: 50 });
    expect(total).toBe(3);
    expect(items).toHaveLength(3);

    const completedTasks = items.filter((t) => t.executionStatus === "completed");
    expect(completedTasks).toHaveLength(3);

    // 4. Verify each completed task has full data
    for (const task of completedTasks) {
      expect(task.category).toBeDefined();
      expect(task.category!.category).toBeTruthy();
      expect(task.priority).toBeDefined();
      expect(task.priority!.priority).toBeTruthy();
      expect(task.actionPlan).toBeDefined();
      expect(task.actionPlan!.steps.length).toBeGreaterThan(0);
    }
  });
});

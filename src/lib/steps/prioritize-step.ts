import { Step } from "../state-machine/step";
import type { StateStore } from "../state-machine/state-store";
import type { EventEmitter } from "../state-machine/types";
import type { LLMProvider } from "../llm/provider";
import { PrioritizedTaskSchema } from "../llm/schemas";
import type { TaskItem } from "../types";
import { STATE_KEYS } from "./state-keys";
import { createLogger } from "../logger";

const log = createLogger({ component: "PrioritizeStep" });

/**
 * Assesses priority for each task by calling the LLM per task.
 * Sets `priority` and updates `executionStatus` to "prioritized" on each TaskItem.
 */
export class PrioritizeStep extends Step {
  readonly name = "prioritize";
  readonly label = "Assessing priority";

  constructor(private llm: LLMProvider) {
    super({ maxRetries: 2 });
  }

  async execute(state: StateStore, emit: EventEmitter): Promise<string> {
    const tasks = state.get<TaskItem[]>(STATE_KEYS.TASKS);
    if (!tasks || tasks.length === 0) {
      throw new Error("No tasks found in state");
    }

    let prioritized = 0;

    for (const task of tasks) {
      if (task.executionStatus === "failed") continue;

      try {
        log.debug({ taskId: task.id, title: task.title }, "Prioritizing task");

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "running",
          message: `Assessing priority: ${task.title}`,
          attempt: 1,
          timestamp: Date.now(),
        });

        const categoryContext = task.category
          ? `Category: ${task.category.category} / ${task.category.subcategory}`
          : "";

        const { parsed } = await this.llm.requestStructured(
          [
            {
              role: "user",
              content: `Assess the priority of this project task. Consider factors like:
- Business impact and urgency
- Technical dependencies (does other work depend on this?)
- Complexity and risk
- Team velocity impact

Task: ${task.title}
Description: ${task.description}
${categoryContext}
Ambiguities: ${task.ambiguities.join(", ") || "None"}

Assign a priority level (critical/high/medium/low), a numeric score (1-10), and explain your reasoning.`,
            },
          ],
          PrioritizedTaskSchema,
          "prioritized_task",
        );

        task.priority = parsed;
        task.executionStatus = "prioritized";
        task.updatedAt = Date.now();
        prioritized++;

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "completed",
          message: `Priority: ${parsed.priority} (score ${parsed.score}/10)`,
          attempt: 1,
          data: { priority: parsed.priority, score: parsed.score },
          timestamp: Date.now(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error({ taskId: task.id, error: errorMessage }, "Failed to prioritize task");
        task.executionStatus = "failed";
        task.error = `Prioritization failed: ${errorMessage}`;
        task.updatedAt = Date.now();

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "failed",
          message: `Failed to prioritize: ${errorMessage}`,
          attempt: 1,
          timestamp: Date.now(),
        });
      }
    }

    state.set(STATE_KEYS.TASKS, tasks);
    log.info({ prioritized, total: tasks.length }, "Prioritization complete");
    return `Prioritized ${prioritized}/${tasks.length} task(s)`;
  }
}

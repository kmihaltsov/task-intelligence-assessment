import { Step } from "../state-machine/step";
import type { StateStore } from "../state-machine/state-store";
import type { EventEmitter } from "../state-machine/types";
import type { LLMProvider } from "../llm/provider";
import { CategorizedTaskSchema } from "../llm/schemas";
import type { TaskItem } from "../types";
import { STATE_KEYS } from "./state-keys";
import { createLogger } from "../logger";

const log = createLogger({ component: "CategorizeStep" });

/**
 * Categorizes each task by calling the LLM per task.
 * Sets `category` and updates `executionStatus` to "categorized" on each TaskItem.
 */
export class CategorizeStep extends Step {
  readonly name = "categorize";
  readonly label = "Categorizing tasks";

  constructor(private llm: LLMProvider) {
    super({ maxRetries: 2 });
  }

  async execute(state: StateStore, emit: EventEmitter): Promise<string> {
    const tasks = state.get<TaskItem[]>(STATE_KEYS.TASKS);
    if (!tasks || tasks.length === 0) {
      throw new Error("No tasks found in state");
    }

    let categorized = 0;

    for (const task of tasks) {
      if (task.executionStatus === "failed") continue;

      try {
        log.debug({ taskId: task.id, title: task.title }, "Categorizing task");

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "running",
          message: `Categorizing: ${task.title}`,
          attempt: 1,
          timestamp: Date.now(),
        });

        const { parsed } = await this.llm.requestStructured(
          [
            {
              role: "user",
              content: `Categorize this project task into a technical category.

Task: ${task.title}
Description: ${task.description}
Domain hint: ${task.domain}

Categories to choose from: Frontend, Backend, Infrastructure, Design, DevOps, Data, Security, Testing, Documentation, Project Management.
Pick the most specific category and subcategory. Provide a confidence score and brief reasoning.`,
            },
          ],
          CategorizedTaskSchema,
          "categorized_task",
        );

        task.category = parsed;
        task.executionStatus = "categorized";
        task.updatedAt = Date.now();
        categorized++;

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "completed",
          message: `Categorized as ${parsed.category} (${Math.round(parsed.confidence * 100)}% confidence)`,
          attempt: 1,
          data: { category: parsed.category, subcategory: parsed.subcategory, confidence: parsed.confidence },
          timestamp: Date.now(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error({ taskId: task.id, error: errorMessage }, "Failed to categorize task");
        task.executionStatus = "failed";
        task.error = `Categorization failed: ${errorMessage}`;
        task.updatedAt = Date.now();

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "failed",
          message: `Failed to categorize: ${errorMessage}`,
          attempt: 1,
          timestamp: Date.now(),
        });
      }
    }

    state.set(STATE_KEYS.TASKS, tasks);
    log.info({ categorized, total: tasks.length }, "Categorization complete");
    return `Categorized ${categorized}/${tasks.length} task(s)`;
  }
}

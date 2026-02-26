import { Step } from "../state-machine/step";
import type { StateStore } from "../state-machine/state-store";
import type { EventEmitter } from "../state-machine/types";
import type { LLMProvider } from "../llm/provider";
import { ActionPlanSchema } from "../llm/schemas";
import type { TaskItem } from "../types";
import { STATE_KEYS } from "./state-keys";
import { createLogger } from "../logger";

const log = createLogger({ component: "ActionPlanStep" });

/**
 * Generates an action plan for each task.
 */
export class ActionPlanStep extends Step {
  readonly name = "action-plan";
  readonly label = "Generating action plans";

  constructor(private llm: LLMProvider) {
    super({ maxRetries: 2 });
  }

  async execute(state: StateStore, emit: EventEmitter): Promise<string> {
    const tasks = state.get<TaskItem[]>(STATE_KEYS.TASKS);
    if (!tasks || tasks.length === 0) {
      throw new Error("No tasks found in state");
    }

    let attempted = 0;
    let planned = 0;

    for (const task of tasks) {
      if (task.executionStatus === "failed") continue;
      attempted++;

      try {
        log.debug({ taskId: task.id, title: task.title }, "Generating action plan");

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "running",
          message: `Generating action plan: ${task.title}`,
          attempt: 1,
          timestamp: Date.now(),
        });

        const categoryContext = task.category
          ? `Category: ${task.category.category} / ${task.category.subcategory}`
          : "";
        const priorityContext = task.priority
          ? `Priority: ${task.priority.priority} (score ${task.priority.score}/10)`
          : "";

        const { parsed } = await this.llm.requestStructured(
          [
            {
              role: "user",
              content: `Generate a practical action plan for this project task. Create an ordered list of concrete, actionable steps.

Task: ${task.title}
Description: ${task.description}
${categoryContext}
${priorityContext}

Create a clear, actionable plan with specific steps. Assess the overall complexity.`,
            },
          ],
          ActionPlanSchema,
          "action_plan",
        );

        task.actionPlan = parsed;
        task.executionStatus = "completed";
        task.updatedAt = Date.now();
        planned++;

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "completed",
          message: `Action plan: ${parsed.steps.length} steps, complexity: ${parsed.estimatedComplexity}`,
          attempt: 1,
          data: {
            stepCount: parsed.steps.length,
            complexity: parsed.estimatedComplexity,
          },
          timestamp: Date.now(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error({ taskId: task.id, error: errorMessage }, "Failed to generate action plan");
        task.executionStatus = "failed";
        task.error = `Action plan failed: ${errorMessage}`;
        task.updatedAt = Date.now();

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "failed",
          message: `Failed to generate action plan: ${errorMessage}`,
          attempt: 1,
          timestamp: Date.now(),
        });
      }
    }

    state.set(STATE_KEYS.TASKS, tasks);
    log.info({ planned, total: tasks.length }, "Action planning complete");
    return `Generated action plans for ${planned}/${tasks.length} task(s)`;
  }
}

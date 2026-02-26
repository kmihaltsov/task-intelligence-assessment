import { Step } from "../state-machine/step";
import type { StateStore } from "../state-machine/state-store";
import type { EventEmitter } from "../state-machine/types";
import type { LLMProvider } from "../llm/provider";
import { ActionPlanSchema } from "../llm/schemas";
import type { TaskItem } from "../types";
import type { ToolRegistry } from "../tools/tool-registry";
import { STATE_KEYS } from "./state-keys";
import { createLogger } from "../logger";

const log = createLogger({ component: "ActionPlanStep" });

/**
 * Generates an action plan for each task.
 * Supports agentic tool use: passes tool definitions to LLM, executes tool calls,
 * and feeds results back before generating the final plan.
 */
export class ActionPlanStep extends Step {
  readonly name = "action-plan";
  readonly label = "Generating action plans";

  constructor(
    private llm: LLMProvider,
    private toolRegistry?: ToolRegistry,
  ) {
    super({ maxRetries: 2 });
  }

  async execute(state: StateStore, emit: EventEmitter): Promise<string> {
    const tasks = state.get<TaskItem[]>(STATE_KEYS.TASKS);
    if (!tasks || tasks.length === 0) {
      throw new Error("No tasks found in state");
    }

    let planned = 0;

    for (const task of tasks) {
      if (task.executionStatus === "failed") continue;

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

        // If tools are available and task has URLs, do a tool-use pass first
        let toolContext = "";
        if (this.toolRegistry && task.urls.length > 0) {
          toolContext = await this.executeToolPass(task, emit);
        }

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
${toolContext ? `\nAdditional context from tools:\n${toolContext}` : ""}

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

  /**
   * Agentic tool use pass: ask LLM with tools available, execute any tool calls,
   * and return the aggregated context.
   */
  private async executeToolPass(task: TaskItem, emit: EventEmitter): Promise<string> {
    if (!this.toolRegistry) return "";

    const toolDefs = this.toolRegistry.getToolDefinitions();
    if (toolDefs.length === 0) return "";

    try {
      emit({
        taskId: task.id,
        stepName: this.name,
        status: "running",
        message: "Checking external resources...",
        attempt: 1,
        timestamp: Date.now(),
      });

      const { toolCalls } = await this.llm.requestWithTools(
        [
          {
            role: "user",
            content: `I'm analyzing this project task and want to gather additional context.

Task: ${task.title}
Description: ${task.description}
URLs found: ${task.urls.join(", ")}

Use the available tools to check any relevant URLs or gather additional context. Only use tools if they are relevant.`,
          },
        ],
        toolDefs,
      );

      if (toolCalls.length === 0) return "";

      const results: string[] = [];
      for (const call of toolCalls) {
        log.info({ tool: call.name, input: call.input }, "Executing tool");

        emit({
          taskId: task.id,
          stepName: this.name,
          status: "running",
          message: `Using tool: ${call.name}`,
          attempt: 1,
          data: { tool: call.name },
          timestamp: Date.now(),
        });

        const result = await this.toolRegistry.execute(call.name, call.input);
        results.push(`${call.name}: ${result}`);
      }

      return results.join("\n");
    } catch (error) {
      log.warn({ taskId: task.id, error: String(error) }, "Tool pass failed, continuing without tool context");
      return "";
    }
  }
}

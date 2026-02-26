import { Step } from "../state-machine/step";
import type { StateStore } from "../state-machine/state-store";
import type { EventEmitter } from "../state-machine/types";
import type { LLMProvider } from "../llm/provider";
import { ParsedTaskListSchema } from "../llm/schemas";
import type { TaskItem } from "../types";
import { STATE_KEYS } from "./state-keys";
import { createLogger } from "../logger";

const log = createLogger({ component: "ParseStep" });

/**
 * Parses raw user input into structured TaskItem[].
 * First step in the pipeline — creates the task list that subsequent steps iterate over.
 */
export class ParseStep extends Step {
  readonly name = "parse";
  readonly label = "Parsing tasks";

  constructor(private llm: LLMProvider) {
    super({ maxRetries: 2 });
  }

  async execute(state: StateStore, emit: EventEmitter): Promise<string> {
    const rawInput = state.get<string>(STATE_KEYS.RAW_INPUT);
    if (!rawInput) {
      throw new Error("No raw input found in state");
    }

    log.debug({ rawInput }, "Parsing raw input");

    const { parsed } = await this.llm.requestStructured(
      [
        {
          role: "user",
          content: `You are a task analysis assistant. Parse the following raw project task input into structured tasks.
Each distinct task should be extracted separately. If the input contains multiple tasks (separated by newlines, commas, or numbering), split them.

For each task:
- Create a concise, actionable title
- Identify the technical domain (frontend, backend, infrastructure, design, devops, data, security, etc.)
- Note any ambiguities or unclear aspects
- Extract any URLs mentioned

Raw input:
${rawInput}`,
        },
      ],
      ParsedTaskListSchema,
      "parsed_task_list",
    );

    const now = Date.now();
    const tasks: TaskItem[] = parsed.tasks.map((t, i) => ({
      id: `task-${now}-${i}`,
      executionStatus: "created",
      status: "backlog",
      title: t.title,
      description: "",
      domain: t.domain,
      ambiguities: t.ambiguities,
      urls: t.urls,
      events: [],
      createdAt: now,
      updatedAt: now,
    }));

    state.set(STATE_KEYS.TASKS, tasks);

    const taskIds = tasks.map((t) => t.id);
    emit({
      taskId: "pipeline",
      stepName: this.name,
      status: "running",
      message: `Parsed ${tasks.length} task(s)`,
      attempt: 1,
      data: { taskIds, taskCount: tasks.length },
      timestamp: Date.now(),
    });

    log.info({ taskCount: tasks.length }, "Tasks parsed");
    return `Parsed ${tasks.length} task(s) from input`;
  }
}

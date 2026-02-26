import { Step } from "./step";
import type { EventEmitter } from "./types";
import { InMemoryStateStore, type StateStore } from "./state-store";
import type { TaskStore } from "../store/task-store";
import type { TaskItem } from "../types";
import { createLogger } from "../logger";

const log = createLogger({ component: "StateMachine" });

export class StateMachine {
  private steps: Step[] = [];

  addStep(step: Step): this {
    this.steps.push(step);
    return this;
  }

  async run(
    pipelineId: string,
    emit: EventEmitter,
    store?: TaskStore,
    initialState?: StateStore,
  ): Promise<StateStore> {
    const state = initialState ?? new InMemoryStateStore();
    const startTime = Date.now();

    log.info({ pipelineId, stepCount: this.steps.length }, "Pipeline started");

    for (const step of this.steps) {
      const success = await this.executeWithRetry(pipelineId, step, state, emit);

      if (store) {
        const tasks = state.get<TaskItem[]>("tasks") ?? [];
        for (const task of tasks) {
          store.save(task);
        }
      }

      if (!success) {
        log.error({ pipelineId, failedStep: step.name }, "Pipeline halted");
        break;
      }
    }

    log.info({ pipelineId, duration: Date.now() - startTime }, "Pipeline completed");

    return state;
  }

  private async executeWithRetry(
    pipelineId: string,
    step: Step,
    state: StateStore,
    emit: EventEmitter,
  ): Promise<boolean> {
    const totalAttempts = step.config.maxRetries + 1;

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      const isRetry = attempt > 1;

      const baseEvent = {
        taskId: pipelineId,
        stepName: step.name,
        attempt,
        timestamp: Date.now(),
      };

      emit({
        ...baseEvent,
        status: isRetry ? "retrying" as const : "running" as const,
        message: isRetry
          ? `Retrying ${step.label} (attempt ${attempt}/${totalAttempts})`
          : `Running ${step.label}`,
      });

      if (isRetry) {
        log.warn({ pipelineId, step: step.name, attempt }, "Step retrying");
      }

      try {
        const stepStart = Date.now();
        const message = await step.execute(state, emit);

        log.info(
          { pipelineId, step: step.name, duration: Date.now() - stepStart },
          "Step completed",
        );

        emit({ ...baseEvent, status: "completed", message });
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isLastAttempt = attempt === totalAttempts;

        if (isLastAttempt) {
          log.error(
            { pipelineId, step: step.name, error: errorMessage },
            "Step failed after all retries",
          );
          emit({
            ...baseEvent,
            status: "failed",
            message: `${step.label} failed: ${errorMessage}`,
          });
          return false;
        }

        log.warn(
          { pipelineId, step: step.name, attempt, error: errorMessage },
          "Step failed, will retry",
        );
      }
    }

    return false;
  }
}

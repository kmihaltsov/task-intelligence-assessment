import { Step } from "./step";
import type { StepEvent, EventEmitter } from "./types";
import { InMemoryStateStore, type StateStore } from "./state-store";
import type { TaskStore } from "../store/task-store";
import type { TaskItem } from "../types";
import { createLogger } from "../logger";

const log = createLogger({ component: "StateMachine" });

/**
 * Orchestrator that runs an ordered sequence of Steps against shared state.
 * Handles retries, event emission, and progressive persistence to TaskStore.
 */
export class StateMachine {
  private steps: Step[] = [];

  /** Chainable step registration */
  addStep(step: Step): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Run the full pipeline.
   * @param pipelineId - identifier for this pipeline run (used in events)
   * @param emit - callback for SSE events
   * @param store - optional server-side store for progressive persistence
   * @param initialState - optional pre-seeded state store
   */
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

      // After each step, sync tasks to the server store
      if (store) {
        const tasks = state.get<TaskItem[]>("tasks");
        if (tasks) {
          for (const task of tasks) {
            store.save(task);
          }
        }
      }

      if (!success) {
        log.error({ pipelineId, failedStep: step.name }, "Pipeline halted");
        break;
      }
    }

    const duration = Date.now() - startTime;
    log.info({ pipelineId, duration }, "Pipeline completed");

    return state;
  }

  private async executeWithRetry(
    pipelineId: string,
    step: Step,
    state: StateStore,
    emit: EventEmitter,
  ): Promise<boolean> {
    const { maxRetries } = step.config;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const isRetry = attempt > 1;

      const event: Omit<StepEvent, "status" | "message"> = {
        taskId: pipelineId,
        stepName: step.name,
        attempt,
        timestamp: Date.now(),
      };

      emit({
        ...event,
        status: isRetry ? "retrying" : "running",
        message: isRetry
          ? `Retrying ${step.label} (attempt ${attempt}/${maxRetries + 1})`
          : `Running ${step.label}`,
      });

      if (isRetry) {
        log.warn({ pipelineId, step: step.name, attempt }, "Step retrying");
      }

      try {
        const stepStart = Date.now();
        const message = await step.execute(state, emit);
        const stepDuration = Date.now() - stepStart;

        log.info(
          { pipelineId, step: step.name, duration: stepDuration },
          "Step completed",
        );

        emit({
          ...event,
          status: "completed",
          message,
        });

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (attempt > maxRetries) {
          log.error(
            { pipelineId, step: step.name, error: errorMessage },
            "Step failed after all retries",
          );

          emit({
            ...event,
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

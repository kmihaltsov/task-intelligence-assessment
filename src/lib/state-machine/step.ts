import type { StepConfig, EventEmitter } from "./types";
import type { StateStore } from "./state-store";

/**
 * Abstract pipeline step. Each concrete step implements `execute`.
 * The step does NOT handle retries — it throws on failure.
 * The StateMachine wraps execution with retry logic.
 */
export abstract class Step {
  abstract readonly name: string;
  abstract readonly label: string;
  readonly config: StepConfig;

  constructor(config?: Partial<StepConfig>) {
    this.config = { maxRetries: 2, ...config };
  }

  /**
   * Execute this step against shared state.
   * @param state - shared pipeline state
   * @param emit - callback to emit progress events
   * @returns a summary message for logging
   */
  abstract execute(state: StateStore, emit: EventEmitter): Promise<string>;
}

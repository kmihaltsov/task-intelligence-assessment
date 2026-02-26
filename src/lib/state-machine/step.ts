import type { StepConfig, EventEmitter } from "./types";
import type { StateStore } from "./state-store";

export abstract class Step {
  abstract readonly name: string;
  abstract readonly label: string;
  readonly config: StepConfig;

  constructor(config?: Partial<StepConfig>) {
    this.config = { maxRetries: 2, ...config };
  }

  abstract execute(state: StateStore, emit: EventEmitter): Promise<string>;
}

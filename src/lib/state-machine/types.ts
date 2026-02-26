/** Status of an individual pipeline step */
export type StepStatus = "pending" | "running" | "retrying" | "completed" | "failed";

/** Event emitted during pipeline execution — wired to SSE on the API layer */
export interface StepEvent {
  taskId: string;
  stepName: string;
  status: StepStatus;
  message: string;
  attempt: number;
  data?: Record<string, unknown>;
  timestamp: number;
}

/** Configuration for a single step */
export interface StepConfig {
  maxRetries: number;
}

/** Callback type for emitting step events */
export type EventEmitter = (event: StepEvent) => void;

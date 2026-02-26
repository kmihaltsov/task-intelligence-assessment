export type StepStatus = "pending" | "running" | "retrying" | "completed" | "failed";

export interface StepEvent {
  taskId: string;
  stepName: string;
  status: StepStatus;
  message: string;
  attempt: number;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface StepConfig {
  maxRetries: number;
}

export type EventEmitter = (event: StepEvent) => void;

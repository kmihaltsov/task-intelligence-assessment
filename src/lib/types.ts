import type { StepEvent } from "./state-machine/types";

export type ExecutionStatus = "created" | "categorized" | "prioritized" | "completed" | "failed";

export type TaskStatus = "backlog" | "in-progress" | "completed";

export interface CategorizedTask {
  category: string;
  subcategory: string;
  confidence: number;
  reasoning: string;
}

export interface PrioritizedTask {
  priority: "critical" | "high" | "medium" | "low";
  score: number;
}

export interface ActionPlan {
  steps: ActionStep[];
  estimatedComplexity: "trivial" | "simple" | "moderate" | "complex" | "very_complex";
  summary: string;
}

export interface ActionStep {
  order: number;
  action: string;
}

export interface TaskItem {
  id: string;
  executionStatus: ExecutionStatus;
  status: TaskStatus;
  title: string;
  description: string;
  domain: string;
  urls: string[];
  category?: CategorizedTask;
  priority?: PrioritizedTask;
  actionPlan?: ActionPlan;
  error?: string;
  events: StepEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SubmitTasksRequest {
  tasks: string[];
}

export interface PatchTaskRequest {
  status?: TaskStatus;
  description?: string;
  domain?: string;
  category?: Partial<CategorizedTask>;
  priority?: Partial<PrioritizedTask>;
  actionPlan?: Partial<ActionPlan>;
}

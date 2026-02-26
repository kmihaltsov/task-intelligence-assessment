import { z } from "zod";

export const ParsedTaskSchema = z.object({
  title: z.string().describe("Concise task title"),
  domain: z.string().describe("Technical domain (e.g., frontend, backend, infrastructure, design)"),
  urls: z.array(z.string()).describe("Any URLs mentioned in the task"),
});

export const ParsedTaskListSchema = z.object({
  tasks: z.array(ParsedTaskSchema).min(1).describe("Parsed tasks extracted from the input"),
});

export type ParsedTask = z.infer<typeof ParsedTaskSchema>;
export type ParsedTaskList = z.infer<typeof ParsedTaskListSchema>;

export const CategorizedTaskSchema = z.object({
  category: z.string().describe("Primary category (e.g., Frontend, Backend, Infrastructure, Design, DevOps, Data, Security)"),
  subcategory: z.string().describe("More specific subcategory"),
  confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
  reasoning: z.string().describe("Brief explanation for the categorization"),
});

export type CategorizedTaskOutput = z.infer<typeof CategorizedTaskSchema>;

export const PrioritizedTaskSchema = z.object({
  priority: z.enum(["critical", "high", "medium", "low"]).describe("Priority level"),
  score: z.number().min(1).max(10).describe("Numeric priority score 1-10"),
});

export type PrioritizedTaskOutput = z.infer<typeof PrioritizedTaskSchema>;

export const ActionStepSchema = z.object({
  order: z.number().int().positive().describe("Step order number"),
  action: z.string().describe("Concise action title"),
});

export const ActionPlanSchema = z.object({
  steps: z.array(ActionStepSchema).min(1).describe("Ordered list of action items"),
  estimatedComplexity: z
    .enum(["trivial", "simple", "moderate", "complex", "very_complex"])
    .describe("Overall complexity estimate"),
  summary: z.string().describe("Brief summary of the action plan"),
});

export type ActionPlanOutput = z.infer<typeof ActionPlanSchema>;

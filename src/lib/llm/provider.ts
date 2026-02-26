import type { z } from "zod";

/** Parsed LLM response with typed output */
export interface LLMResponse<T> {
  parsed: T;
  rawText: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: LLMToolDefinition[];
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Generic LLM provider interface.
 * All business logic depends on this abstraction — never on a specific SDK.
 */
export interface LLMProvider {
  /**
   * Request structured output from the LLM, validated against a Zod schema.
   * Throws LLMValidationError on schema mismatch, LLMProviderError on infra issues.
   */
  requestStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodType<T>,
    schemaName: string,
    options?: LLMRequestOptions,
  ): Promise<LLMResponse<T>>;

  /**
   * Request unstructured (freeform) text + optional tool calls.
   * Used when the step needs tool use without structured output.
   */
  requestWithTools(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    options?: Omit<LLMRequestOptions, "tools">,
  ): Promise<{ text: string; toolCalls: ToolCall[] }>;
}

/** Thrown when LLM output doesn't match the expected schema */
export class LLMValidationError extends Error {
  constructor(
    message: string,
    public readonly rawOutput: string,
    public readonly zodErrors?: z.ZodError,
  ) {
    super(message);
    this.name = "LLMValidationError";
  }
}

/** Thrown on infrastructure errors (network, auth, rate-limit) */
export class LLMProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "LLMProviderError";
  }
}

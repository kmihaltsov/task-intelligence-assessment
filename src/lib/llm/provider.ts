import type { z } from "zod";

/** Parsed LLM response with typed output */
export interface LLMResponse<T> {
  parsed: T;
  rawText: string;
}

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
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

/**
 * Factory that returns the configured LLM provider.
 * Keeps concrete adapter imports out of business logic — only this file
 * knows which SDK is in use.
 */
export function createLLMProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();

  switch (provider) {
    case "anthropic": {
      // Dynamic require avoids importing the SDK at module level in consumers
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AnthropicAdapter } = require("./anthropic-adapter");
      return new AnthropicAdapter();
    }
    default:
      throw new LLMProviderError(
        `Unknown LLM_PROVIDER "${provider}". Supported: anthropic`,
        undefined,
        false,
      );
  }
}

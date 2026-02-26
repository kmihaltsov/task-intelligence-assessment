import type { z } from "zod";

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

export interface LLMProvider {
  requestStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodType<T>,
    schemaName: string,
    options?: LLMRequestOptions,
  ): Promise<LLMResponse<T>>;
}

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

export function createLLMProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();

  switch (provider) {
    case "anthropic": {
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

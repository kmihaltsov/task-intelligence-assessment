import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  type LLMProvider,
  type LLMResponse,
  type LLMMessage,
  type LLMRequestOptions,
  LLMValidationError,
  LLMProviderError,
} from "./provider";
import { createLogger } from "../logger";

const log = createLogger({ component: "AnthropicAdapter" });

const MAX_CORRECTION_ATTEMPTS = 2;

/** Turn Zod's error structure into a human-readable list for the correction prompt. */
function formatZodErrors(zodError: z.ZodError): string {
  return zodError.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `"${issue.path.join(".")}"` : "(root)";
      return `- Field ${path}: ${issue.message}`;
    })
    .join("\n");
}

/**
 * Anthropic Claude adapter.
 * Uses tool_use to force structured JSON output: converts Zod schema → JSON Schema,
 * defines a `structured_output` tool, and parses the tool call input.
 *
 * This is the ONLY file that imports @anthropic-ai/sdk.
 */
export class AnthropicAdapter implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new LLMProviderError("ANTHROPIC_API_KEY environment variable is required", undefined, false);
    }
    this.client = new Anthropic({ apiKey });
    this.model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  }

  async requestStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodType<T>,
    schemaName: string,
    options?: LLMRequestOptions,
  ): Promise<LLMResponse<T>> {
    const tool = this.buildTool(schema, schemaName);
    let currentMessages = messages;
    let lastError: LLMValidationError | undefined;

    for (let attempt = 0; attempt <= MAX_CORRECTION_ATTEMPTS; attempt++) {
      try {
        return await this.attemptStructured(currentMessages, schema, schemaName, tool, options);
      } catch (error) {
        if (!(error instanceof LLMValidationError) || !error.zodErrors) throw error;
        lastError = error;

        if (attempt < MAX_CORRECTION_ATTEMPTS) {
          log.info(
            { schemaName, attempt: attempt + 1, maxAttempts: MAX_CORRECTION_ATTEMPTS },
            "Attempting self-correction for schema validation failure",
          );

          // Build correction context: original conversation + failed output + validation errors
          currentMessages = [
            ...currentMessages,
            { role: "assistant" as const, content: error.rawOutput },
            {
              role: "user" as const,
              content: `Your previous response did not match the required JSON schema "${schemaName}".

Validation errors:
${formatZodErrors(error.zodErrors)}

Please output a corrected version that strictly matches the schema.`,
            },
          ];
        }
      }
    }

    // All correction attempts exhausted — throw the last validation error
    throw lastError!;
  }

  private buildTool<T>(schema: z.ZodType<T>, schemaName: string): Anthropic.Messages.Tool {
    // Use jsonSchema7 target — produces numeric exclusiveMinimum/Maximum
    // compatible with JSON Schema draft 2020-12 required by Anthropic's API.
    // Strip the $schema key since Anthropic doesn't accept it.
    const rawSchema = zodToJsonSchema(schema, { target: "jsonSchema7" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $schema: _schemaKey, ...jsonSchema } = rawSchema as Record<string, unknown>;

    return {
      name: schemaName,
      description: `Output the result as structured JSON matching the ${schemaName} schema.`,
      input_schema: jsonSchema as Anthropic.Messages.Tool.InputSchema,
    };
  }

  private async attemptStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodType<T>,
    schemaName: string,
    tool: Anthropic.Messages.Tool,
    options?: LLMRequestOptions,
  ): Promise<LLMResponse<T>> {
    try {
      log.info({ model: this.model, schemaName }, "Requesting structured output");

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.3,
        tools: [tool],
        tool_choice: { type: "tool", name: schemaName },
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      log.info(
        { model: this.model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
        "LLM response received",
      );

      // Extract the tool use block
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use",
      );

      if (!toolUseBlock) {
        // Fallback: try to extract JSON from text blocks
        const textBlock = response.content.find(
          (block): block is Anthropic.Messages.TextBlock => block.type === "text",
        );
        const rawText = textBlock?.text ?? "";
        return this.parseJsonFallback(rawText, schema);
      }

      const rawInput = toolUseBlock.input as Record<string, unknown>;
      const rawText = JSON.stringify(rawInput);

      // Validate against Zod schema
      const result = schema.safeParse(rawInput);
      if (!result.success) {
        throw new LLMValidationError(
          `Schema validation failed for ${schemaName}: ${result.error.message}`,
          rawText,
          result.error,
        );
      }

      return { parsed: result.data, rawText };
    } catch (error) {
      if (error instanceof LLMValidationError) throw error;
      if (error instanceof Anthropic.APIError) {
        throw new LLMProviderError(
          error.message,
          error.status,
          error.status === 429 || error.status >= 500,
        );
      }
      throw error;
    }
  }

  private parseJsonFallback<T>(text: string, schema: z.ZodType<T>): LLMResponse<T> {
    // Try to find JSON in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new LLMValidationError("No JSON found in LLM response", text);
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const result = schema.safeParse(parsed);
      if (!result.success) {
        throw new LLMValidationError(
          `Fallback JSON validation failed: ${result.error.message}`,
          text,
          result.error,
        );
      }
      return { parsed: result.data, rawText: text };
    } catch (error) {
      if (error instanceof LLMValidationError) throw error;
      throw new LLMValidationError("Failed to parse JSON from LLM response", text);
    }
  }
}

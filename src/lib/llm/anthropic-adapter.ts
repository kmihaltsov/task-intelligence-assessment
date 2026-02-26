import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  type LLMProvider,
  type LLMResponse,
  type LLMMessage,
  type LLMRequestOptions,
  type LLMToolDefinition,
  type ToolCall,
  LLMValidationError,
  LLMProviderError,
} from "./provider";
import { createLogger } from "../logger";

const log = createLogger({ component: "AnthropicAdapter" });

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
    this.model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  }

  async requestStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodType<T>,
    schemaName: string,
    options?: LLMRequestOptions,
  ): Promise<LLMResponse<T>> {
    // Use jsonSchema7 target — produces numeric exclusiveMinimum/Maximum
    // compatible with JSON Schema draft 2020-12 required by Anthropic's API.
    // Strip the $schema key since Anthropic doesn't accept it.
    const rawSchema = zodToJsonSchema(schema, { target: "jsonSchema7" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $schema: _schemaKey, ...jsonSchema } = rawSchema as Record<string, unknown>;

    // Use tool_use to force structured output
    const tool: Anthropic.Messages.Tool = {
      name: schemaName,
      description: `Output the result as structured JSON matching the ${schemaName} schema.`,
      input_schema: jsonSchema as Anthropic.Messages.Tool.InputSchema,
    };

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

  async requestWithTools(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    options?: Omit<LLMRequestOptions, "tools">,
  ): Promise<{ text: string; toolCalls: ToolCall[] }> {
    const anthropicTools: Anthropic.Messages.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Messages.Tool.InputSchema,
    }));

    try {
      log.info({ model: this.model, toolCount: tools.length }, "Requesting with tools");

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.3,
        tools: anthropicTools,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      log.info(
        { model: this.model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
        "LLM response received",
      );

      const text = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const toolCalls: ToolCall[] = response.content
        .filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use")
        .map((b) => ({
          id: b.id,
          name: b.name,
          input: b.input as Record<string, unknown>,
        }));

      return { text, toolCalls };
    } catch (error) {
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

import type { LLMToolDefinition } from "../llm/provider";
import { createLogger } from "../logger";

const log = createLogger({ component: "ToolRegistry" });

/** Interface for an agent tool that can be invoked autonomously by the LLM */
export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(input: Record<string, unknown>): Promise<string>;
}

/**
 * Registry for agent tools.
 * Converts registered tools to LLM-compatible definitions and executes them by name.
 */
export class ToolRegistry {
  private tools = new Map<string, AgentTool>();

  register(tool: AgentTool): this {
    this.tools.set(tool.name, tool);
    return this;
  }

  /** Get tool definitions in the format expected by LLMProvider */
  getToolDefinitions(): LLMToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }

  /** Execute a tool by name */
  async execute(name: string, input: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      const msg = `Unknown tool: ${name}`;
      log.error({ toolName: name }, msg);
      return msg;
    }

    try {
      log.info({ toolName: name, input }, "Tool invoked");
      const result = await tool.execute(input);
      log.info({ toolName: name, result }, "Tool result");
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error({ toolName: name, error: errorMsg }, "Tool execution failed");
      return `Tool error: ${errorMsg}`;
    }
  }
}

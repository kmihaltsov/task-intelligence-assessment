import type { AgentTool } from "./tool-registry";
import { createLogger } from "../logger";

const log = createLogger({ component: "UrlHealthCheckTool" });

/** Agent tool that checks the health/accessibility of a URL via HEAD request */
export const urlHealthCheckTool: AgentTool = {
  name: "url_health_check",
  description: "Check if a URL is accessible. Returns the HTTP status code and whether the URL is reachable.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to check",
      },
    },
    required: ["url"],
  },

  async execute(input: Record<string, unknown>): Promise<string> {
    const url = input.url as string;
    if (!url) {
      return JSON.stringify({ error: "URL is required" });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeout);

      const result = {
        url,
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      };

      log.info(result, "URL health check result");
      return JSON.stringify(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const result = {
        url,
        ok: false,
        error: errorMsg,
      };

      log.warn(result, "URL health check failed");
      return JSON.stringify(result);
    }
  },
};

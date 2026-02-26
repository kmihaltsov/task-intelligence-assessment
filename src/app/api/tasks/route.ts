import { NextRequest, NextResponse } from "next/server";
import { InMemoryStateStore } from "@/lib/state-machine/state-store";
import type { StepEvent } from "@/lib/state-machine/types";
import { AnthropicAdapter } from "@/lib/llm/anthropic-adapter";
import { createTaskPipeline } from "@/lib/steps/pipeline";
import { ToolRegistry } from "@/lib/tools/tool-registry";
import { urlHealthCheckTool } from "@/lib/tools/url-health-check";
import { taskStore } from "@/lib/store/task-store";
import { STATE_KEYS } from "@/lib/steps/state-keys";
import { createLogger } from "@/lib/logger";
import type { SubmitTasksRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

const log = createLogger({ component: "API:tasks" });

/**
 * GET /api/tasks — List tasks (paginated, filterable)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
  const category = searchParams.get("category") || undefined;
  const priority = searchParams.get("priority") || undefined;

  log.info({ page, pageSize, category, priority }, "Listing tasks");

  const result = taskStore.list({ page, pageSize, category, priority });
  return NextResponse.json(result);
}

/**
 * POST /api/tasks — Submit tasks for processing, streams SSE events.
 * Uses ReadableStream to return SSE response immediately while pipeline runs.
 */
export async function POST(request: NextRequest) {
  let body: SubmitTasksRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
    return NextResponse.json(
      { error: "Request body must contain a non-empty 'tasks' array" },
      { status: 400 },
    );
  }

  const rawInput = body.tasks.join("\n");
  const pipelineId = `pipeline-${Date.now()}`;

  log.info({ pipelineId, taskCount: body.tasks.length }, "SSE stream opened");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(event: StepEvent) {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      // Non-awaited IIFE — returns Response immediately while pipeline runs
      (async () => {
        try {
          const llm = new AnthropicAdapter();
          const toolRegistry = new ToolRegistry().register(urlHealthCheckTool);
          const pipeline = createTaskPipeline(llm, toolRegistry);

          const state = new InMemoryStateStore();
          state.set(STATE_KEYS.RAW_INPUT, rawInput);

          await pipeline.run(pipelineId, send, taskStore, state);

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log.error({ pipelineId, error: errorMessage }, "Pipeline error");

          const errorEvent: StepEvent = {
            taskId: pipelineId,
            stepName: "pipeline",
            status: "failed",
            message: `Pipeline error: ${errorMessage}`,
            attempt: 1,
            timestamp: Date.now(),
          };
          const data = JSON.stringify(errorEvent);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
          log.info({ pipelineId }, "SSE stream closed");
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

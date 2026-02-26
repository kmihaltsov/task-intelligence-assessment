import { NextRequest, NextResponse } from "next/server";
import { taskStore } from "@/lib/store/task-store";
import { createLogger } from "@/lib/logger";
import type { PatchTaskRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

const log = createLogger({ component: "API:tasks/[id]" });

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/tasks/[id] — Get a single task by ID
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const task = taskStore.get(id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

/**
 * PATCH /api/tasks/[id] — Inline edit: update priority, category, or action plan
 * Direct store mutation, no LLM involved.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const task = taskStore.get(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let body: PatchTaskRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  log.info({ taskId: id, patch: body }, "Patching task");

  const patch: Record<string, unknown> = {};

  if (body.status) {
    const validStatuses = ["backlog", "in-progress", "completed"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (body.description != null) {
    patch.description = body.description;
  }
  if (body.domain != null) {
    patch.domain = body.domain;
  }
  if (body.category) {
    patch.category = { ...task.category, ...body.category };
  }
  if (body.priority) {
    patch.priority = { ...task.priority, ...body.priority };
  }
  if (body.actionPlan) {
    patch.actionPlan = { ...task.actionPlan, ...body.actionPlan };
  }

  try {
    const updated = taskStore.update(id, patch);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id] — Remove a task
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const deleted = taskStore.delete(id);
  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  log.info({ taskId: id }, "Task deleted");
  return NextResponse.json({ success: true });
}

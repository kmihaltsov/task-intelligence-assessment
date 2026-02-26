import Database from "better-sqlite3";
import path from "path";
import type { StepEvent } from "@/lib/state-machine/types";
import type { TaskItem, PaginatedResponse } from "@/lib/types";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

/** Test DB lives alongside production DB but in a separate file */
export const TEST_DB_PATH = path.join(process.cwd(), "data", "tasks-test.db");

/**
 * Truncate the tasks table in the test database.
 * Creates the table if it doesn't exist yet (first run).
 */
export function cleanDatabase(): void {
  const db = new Database(TEST_DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      status      TEXT NOT NULL DEFAULT 'created',
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      domain      TEXT NOT NULL DEFAULT '',
      urls        TEXT NOT NULL DEFAULT '[]',
      category    TEXT,
      priority    TEXT,
      action_plan TEXT,
      error       TEXT,
      events      TEXT NOT NULL DEFAULT '[]',
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );
    DELETE FROM tasks;
  `);
  db.close();
}

/**
 * Submit tasks via POST /api/tasks and consume the SSE stream.
 * Returns collected StepEvents once the stream completes.
 */
export async function submitAndConsume(tasks: string[]): Promise<StepEvent[]> {
  const response = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`POST /api/tasks failed: ${response.status} — ${body}`);
  }

  return consumeSSE(response);
}

/**
 * Read SSE events from a Response until [DONE].
 */
export async function consumeSSE(response: Response): Promise<StepEvent[]> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  const events: StepEvent[] = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return events;

      try {
        events.push(JSON.parse(data));
      } catch {
        // skip malformed
      }
    }
  }

  return events;
}

/**
 * GET /api/tasks with optional query params.
 */
export async function getTasks(params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  priority?: string;
}): Promise<PaginatedResponse<TaskItem>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.category) qs.set("category", params.category);
  if (params?.priority) qs.set("priority", params.priority);

  const response = await fetch(`${BASE_URL}/api/tasks?${qs}`);
  if (!response.ok) throw new Error(`GET /api/tasks failed: ${response.status}`);
  return response.json();
}

/**
 * GET /api/tasks/:id
 */
export async function getTask(id: string): Promise<TaskItem> {
  const response = await fetch(`${BASE_URL}/api/tasks/${id}`);
  if (!response.ok) throw new Error(`GET /api/tasks/${id} failed: ${response.status}`);
  return response.json();
}

/**
 * PATCH /api/tasks/:id
 */
export async function patchTask(
  id: string,
  patch: Record<string, unknown>,
): Promise<TaskItem> {
  const response = await fetch(`${BASE_URL}/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`PATCH /api/tasks/${id} failed: ${response.status}`);
  return response.json();
}

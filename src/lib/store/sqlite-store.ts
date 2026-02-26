import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import type { TaskStore } from "./task-store";
import type {
  TaskItem,
  PaginatedResponse,
  CategorizedTask,
  PrioritizedTask,
  ActionPlan,
} from "../types";
import type { StepEvent } from "../state-machine/types";
import { createLogger } from "../logger";

const log = createLogger({ component: "SqliteTaskStore" });

interface TaskRow {
  id: string;
  execution_status: string;
  status: string;
  title: string;
  description: string;
  domain: string;
  urls: string;
  category: string | null;
  priority: string | null;
  action_plan: string | null;
  error: string | null;
  events: string;
  created_at: number;
  updated_at: number;
}

export class SqliteTaskStore implements TaskStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath =
      dbPath ?? path.join(process.cwd(), "data", "tasks.db");

    const dir = path.dirname(resolvedPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(resolvedPath);

    this.db.pragma("journal_mode = WAL");

    this.migrate();
    log.info({ dbPath: resolvedPath }, "SQLite store initialized");
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id               TEXT PRIMARY KEY,
        execution_status TEXT NOT NULL DEFAULT 'created',
        status           TEXT NOT NULL DEFAULT 'backlog',
        title            TEXT NOT NULL,
        description      TEXT NOT NULL DEFAULT '',
        domain           TEXT NOT NULL DEFAULT '',
        urls             TEXT NOT NULL DEFAULT '[]',
        category         TEXT,
        priority         TEXT,
        action_plan      TEXT,
        error            TEXT,
        events           TEXT NOT NULL DEFAULT '[]',
        created_at       INTEGER NOT NULL,
        updated_at       INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_execution_status ON tasks(execution_status);
      CREATE INDEX IF NOT EXISTS idx_tasks_status           ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at       ON tasks(created_at DESC);
    `);

    const columns = this.db.pragma("table_info(tasks)") as { name: string }[];
    const colNames = columns.map((c) => c.name);
    if (colNames.includes("status") && !colNames.includes("execution_status")) {
      this.db.exec(`
        ALTER TABLE tasks RENAME COLUMN status TO execution_status;
        ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'backlog';
      `);
    }
  }

  save(task: TaskItem): void {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, execution_status, status, title, description, domain, urls,
                         category, priority, action_plan, error, events, created_at, updated_at)
      VALUES (@id, @execution_status, @status, @title, @description, @domain, @urls,
              @category, @priority, @action_plan, @error, @events, @created_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        execution_status = @execution_status,
        status           = @status,
        title            = @title,
        description      = @description,
        domain           = @domain,
        urls             = @urls,
        category         = @category,
        priority         = @priority,
        action_plan      = @action_plan,
        error            = @error,
        events           = @events,
        updated_at       = @updated_at
    `);

    stmt.run(this.toRow(task));
    log.info({ taskId: task.id, executionStatus: task.executionStatus }, "Task saved");
  }

  get(id: string): TaskItem | undefined {
    const row = this.db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(id) as TaskRow | undefined;

    return row ? this.fromRow(row) : undefined;
  }

  list(opts: {
    page: number;
    pageSize: number;
    category?: string;
    priority?: string;
  }): PaginatedResponse<TaskItem> {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (opts.category) {
      conditions.push(
        "LOWER(json_extract(category, '$.category')) = LOWER(@category)",
      );
      params.category = opts.category;
    }

    if (opts.priority) {
      conditions.push(
        "LOWER(json_extract(priority, '$.priority')) = LOWER(@priority)",
      );
      params.priority = opts.priority;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as cnt FROM tasks ${where}`)
      .get(params) as { cnt: number };
    const total = countRow.cnt;

    const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
    const offset = (opts.page - 1) * opts.pageSize;

    const rows = this.db
      .prepare(
        `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`,
      )
      .all({ ...params, limit: opts.pageSize, offset }) as TaskRow[];

    return {
      items: rows.map((r) => this.fromRow(r)),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
      totalPages,
    };
  }

  update(id: string, patch: Partial<TaskItem>): TaskItem {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }

    const updated: TaskItem = {
      ...existing,
      ...patch,
      id: existing.id, // Never allow id override
      updatedAt: Date.now(),
    };

    this.save(updated);
    log.info({ taskId: id }, "Task updated");
    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    const deleted = result.changes > 0;
    if (deleted) {
      log.info({ taskId: id }, "Task deleted");
    }
    return deleted;
  }

  private toRow(task: TaskItem): Record<string, unknown> {
    return {
      id: task.id,
      execution_status: task.executionStatus,
      status: task.status,
      title: task.title,
      description: task.description,
      domain: task.domain,
      urls: JSON.stringify(task.urls),
      category: task.category ? JSON.stringify(task.category) : null,
      priority: task.priority ? JSON.stringify(task.priority) : null,
      action_plan: task.actionPlan ? JSON.stringify(task.actionPlan) : null,
      error: task.error ?? null,
      events: JSON.stringify(task.events),
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    };
  }

  private fromRow(row: TaskRow): TaskItem {
    return {
      id: row.id,
      executionStatus: row.execution_status as TaskItem["executionStatus"],
      status: row.status as TaskItem["status"],
      title: row.title,
      description: row.description,
      domain: row.domain,
      urls: JSON.parse(row.urls) as string[],
      category: row.category
        ? (JSON.parse(row.category) as CategorizedTask)
        : undefined,
      priority: row.priority
        ? (JSON.parse(row.priority) as PrioritizedTask)
        : undefined,
      actionPlan: row.action_plan
        ? (JSON.parse(row.action_plan) as ActionPlan)
        : undefined,
      error: row.error ?? undefined,
      events: JSON.parse(row.events) as StepEvent[],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

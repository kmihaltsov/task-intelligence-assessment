import type { TaskItem, PaginatedResponse } from "../types";

/** Interface for task storage */
export interface TaskStore {
  save(task: TaskItem): void;
  get(id: string): TaskItem | undefined;
  list(opts: {
    page: number;
    pageSize: number;
    category?: string;
    priority?: string;
  }): PaginatedResponse<TaskItem>;
  update(id: string, patch: Partial<TaskItem>): TaskItem;
  delete(id: string): boolean;
}

import { SqliteTaskStore } from "./sqlite-store";

/** Lazily-initialized singleton — avoids SQLite constructor during Next.js build */
let _store: TaskStore | undefined;

export const taskStore: TaskStore = new Proxy({} as TaskStore, {
  get(_target, prop: string) {
    if (!_store) {
      _store = new SqliteTaskStore(process.env.DB_PATH);
    }
    return (_store as unknown as Record<string, unknown>)[prop];
  },
});

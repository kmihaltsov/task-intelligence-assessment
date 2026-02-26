import type { TaskItem, PaginatedResponse } from "../types";
import { SqliteTaskStore } from "./sqlite-store";

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

let _store: TaskStore | undefined;

function getStore(): TaskStore {
  if (!_store) {
    _store = new SqliteTaskStore(process.env.DB_PATH);
  }
  return _store;
}

export const taskStore: TaskStore = new Proxy({} as TaskStore, {
  get(_target, prop: keyof TaskStore) {
    const store = getStore();
    const value = store[prop];
    if (typeof value === "function") {
      return value.bind(store);
    }
    return value;
  },
});

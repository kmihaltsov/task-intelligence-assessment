"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { TaskItem, PaginatedResponse } from "@/lib/types";

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function taskListKey(opts: {
  page: number;
  pageSize: number;
  category?: string;
  priority?: string;
}): string {
  const params = new URLSearchParams();
  params.set("page", String(opts.page));
  params.set("pageSize", String(opts.pageSize));
  if (opts.category) params.set("category", opts.category);
  if (opts.priority) params.set("priority", opts.priority);
  return `/api/tasks?${params}`;
}

interface UseTasksOptions {
  page?: number;
  pageSize?: number;
  category?: string;
  priority?: string;
}

interface UseTasksReturn {
  data: PaginatedResponse<TaskItem> | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateTask: (id: string, patch: Record<string, unknown>) => Promise<TaskItem | null>;
  deleteTask: (id: string) => Promise<boolean>;
}

function formatError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return String(error);
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { page = 1, pageSize = 10, category, priority } = options;

  const key = taskListKey({ page, pageSize, category, priority });

  const { data, error: swrError, isLoading, mutate } = useSWR<PaginatedResponse<TaskItem>>(
    key,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true },
  );

  async function updateTask(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<TaskItem | null> {
    const updated = await mutate(
      async (current) => {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updatedTask: TaskItem = await res.json();

        if (!current) return current;
        return {
          ...current,
          items: current.items.map((t) => (t.id === id ? updatedTask : t)),
        };
      },
      { revalidate: false },
    );

    return updated?.items.find((t) => t.id === id) ?? null;
  }

  async function deleteTask(id: string): Promise<boolean> {
    try {
      await mutate(
        async (current) => {
          const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          if (!current) return current;
          return {
            ...current,
            items: current.items.filter((t) => t.id !== id),
            total: current.total - 1,
          };
        },
        { revalidate: true },
      );
      return true;
    } catch {
      return false;
    }
  }

  function refetch(): void {
    globalMutate((k) => typeof k === "string" && k.startsWith("/api/tasks?"));
  }

  return {
    data: data ?? null,
    isLoading,
    error: formatError(swrError),
    refetch,
    updateTask,
    deleteTask,
  };
}

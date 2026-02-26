"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { TaskItem, PaginatedResponse } from "@/lib/types";

/** Shared fetcher — throws on non-2xx so SWR surfaces the error */
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Build the SWR cache key from query params */
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

/**
 * Client-side hook for fetching the paginated task list.
 * Backed by SWR for caching, deduplication, and revalidation.
 */
export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { page = 1, pageSize = 10, category, priority } = options;

  const key = taskListKey({
    page,
    pageSize,
    category: category || undefined,
    priority: priority || undefined,
  });

  const { data, error: swrError, isLoading, mutate } = useSWR<PaginatedResponse<TaskItem>>(
    key,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true },
  );

  const updateTask = async (
    id: string,
    patch: Record<string, unknown>,
  ): Promise<TaskItem | null> => {
    // Optimistic update
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

    const item = updated?.items.find((t) => t.id === id);
    return item ?? null;
  };

  const deleteTask = async (id: string): Promise<boolean> => {
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
  };

  const refetch = () => {
    // Revalidate all task list keys (any page/filter combo)
    globalMutate((k) => typeof k === "string" && k.startsWith("/api/tasks?"));
  };

  return {
    data: data ?? null,
    isLoading,
    error: swrError ? (swrError instanceof Error ? swrError.message : String(swrError)) : null,
    refetch,
    updateTask,
    deleteTask,
  };
}

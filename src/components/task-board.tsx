"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import type { TaskItem, TaskStatus } from "@/lib/types";
import { TaskCard } from "./task-card";
import { TaskDetailPanel } from "./task-detail-panel";
import { FilterBar } from "./filter-bar";
import { KanbanColumnSkeleton } from "./ui/skeleton";
import { Button } from "./ui/button";

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "backlog", label: "Backlog", dot: "bg-neutral-400" },
  { status: "in-progress", label: "In Progress", dot: "bg-accent-500" },
  { status: "completed", label: "Completed", dot: "bg-emerald-500" },
];

export function TaskBoard() {
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const { data, isLoading, error, updateTask, deleteTask } = useTasks({
    page: 1,
    pageSize: 100,
    category: category || undefined,
    priority: priority || undefined,
  });

  const filteredItems = data?.items ?? [];

  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: filteredItems.filter((t) => t.status === col.status),
  }));

  const totalCount = filteredItems.length;

  // Keep selected task in sync with data (e.g. after status change)
  const syncedSelectedTask = selectedTask
    ? filteredItems.find((t) => t.id === selectedTask.id) ?? selectedTask
    : null;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <FilterBar
          category={category}
          priority={priority}
          onCategoryChange={setCategory}
          onPriorityChange={setPriority}
        />
        {data && (
          <span className="text-xs text-neutral-400 font-mono tabular-nums shrink-0">
            {totalCount} task{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 shadow-card p-5 ring-1 ring-inset ring-red-200/60">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="kanban-columns">
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
        </div>
      )}

      {/* Kanban columns */}
      {!isLoading && data && (
        <div className="kanban-columns">
          {columns.map((col) => (
            <div
              key={col.status}
              className="bg-ground-100/60 rounded-xl p-2.5 pt-3 flex flex-col min-h-52"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wide">
                  {col.label}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono tabular-nums ml-auto">
                  {col.tasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2">
                {col.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={setSelectedTask}
                  />
                ))}

                {col.tasks.length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-[11px] text-neutral-400">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global empty state */}
      {!isLoading && data && totalCount === 0 && (
        <EmptyState hasFilters={!!(category || priority)} />
      )}

      {/* Detail panel */}
      {syncedSelectedTask && (
        <TaskDetailPanel
          task={syncedSelectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-xl bg-white shadow-card py-20 px-6 text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-ground-100 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
        </svg>
      </div>
      <p className="text-sm font-medium text-neutral-700 mb-1">
        {hasFilters ? "No matching tasks" : "No tasks yet"}
      </p>
      <p className="text-xs text-neutral-400 max-w-xs mx-auto">
        {hasFilters
          ? "Try adjusting your filters to see more results."
          : "Submit tasks on the home page to have them analyzed and prioritized by AI."}
      </p>
      {!hasFilters && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={() => window.location.href = "/"}>
          Submit tasks
        </Button>
      )}
    </div>
  );
}
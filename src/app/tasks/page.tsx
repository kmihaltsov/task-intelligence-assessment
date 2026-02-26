"use client";

import { TaskBoard } from "@/components/task-board";

export default function TasksPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Tasks</h1>
        <p className="text-neutral-400 text-xs mt-1">
          AI-analyzed tasks with categories, priorities, and action plans. Click a card to view details.
        </p>
      </div>

      <TaskBoard />
    </div>
  );
}

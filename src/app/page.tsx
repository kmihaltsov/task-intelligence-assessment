"use client";

import { TaskBoard } from "@/components/task-board";

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Tasks</h1>
        <p className="text-neutral-400 text-xs mt-1">
          Categorized and prioritized by AI
        </p>
      </div>

      <TaskBoard />
    </div>
  );
}

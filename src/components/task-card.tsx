"use client";

import type { TaskItem } from "@/lib/types";
import { Badge, priorityVariant } from "./ui/badge";

interface TaskCardProps {
  task: TaskItem;
  onSelect: (task: TaskItem) => void;
}

const executionDot: Record<string, string> = {
  created: "bg-neutral-400",
  categorized: "bg-accent-400",
  prioritized: "bg-violet-400",
  completed: "bg-emerald-400",
  failed: "bg-red-400",
};

export function TaskCard({ task, onSelect }: TaskCardProps) {
  const showExecutionDot = task.executionStatus === "failed" || task.executionStatus === "created";

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className="w-full text-left bg-white rounded-lg shadow-card p-3 transition-shadow duration-150 hover:shadow-card-hover cursor-pointer group"
    >
      {/* Title + optional execution dot */}
      <div className="relative">
        {showExecutionDot && (
          <span
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${executionDot[task.executionStatus] ?? "bg-neutral-400"}`}
            title={`Pipeline: ${task.executionStatus}`}
          />
        )}
        <p className="text-sm text-neutral-800 line-clamp-2 group-hover:text-neutral-950 transition-colors leading-snug">
          {task.title}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mt-2">
        {task.priority && (
          <Badge variant={priorityVariant(task.priority.priority)} className="text-[10px] px-1.5 py-0">
            {task.priority.priority}
          </Badge>
        )}
        {task.category && (
          <Badge variant="accent" className="text-[10px] px-1.5 py-0">
            {task.category.category}
          </Badge>
        )}
      </div>
    </button>
  );
}

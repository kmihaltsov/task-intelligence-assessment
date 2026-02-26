"use client";

import type { TaskItem } from "@/lib/types";
import { Badge, priorityVariant } from "./ui/badge";

interface TaskCardProps {
  task: TaskItem;
  onSelect: (task: TaskItem) => void;
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  const isFailed = task.executionStatus === "failed";

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className={`
        w-full text-left bg-white rounded-lg shadow-card p-3
        transition-all duration-150 hover:shadow-card-hover
        cursor-pointer group
        ${isFailed ? "ring-1 ring-inset ring-red-200/60" : ""}
      `}
    >
      <p className="text-sm text-neutral-800 line-clamp-2 group-hover:text-neutral-950 transition-colors leading-snug">
        {task.title}
      </p>

      {/* Badges */}
      {(task.priority || task.category) && (
        <div className="flex items-center gap-1.5 mt-2.5">
          {task.priority && (
            <Badge variant={priorityVariant(task.priority.priority)} className="text-[11px] px-1.5 py-0.5">
              {task.priority.priority}
            </Badge>
          )}
          {task.category && (
            <Badge variant="accent" className="text-[11px] px-1.5 py-0.5">
              {task.category.category}
            </Badge>
          )}
        </div>
      )}
    </button>
  );
}
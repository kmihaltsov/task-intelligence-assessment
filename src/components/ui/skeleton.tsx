import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export function Skeleton({ width, height, className = "", style, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-100 ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-card p-3 space-y-2.5">
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3.5 w-3/5" />
      <div className="flex gap-1.5 pt-0.5">
        <Skeleton className="h-4 w-10 rounded-md" />
        <Skeleton className="h-4 w-14 rounded-md" />
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="bg-ground-100/60 rounded-xl p-2.5 pt-3">
      <div className="flex items-center gap-2 mb-3 px-1.5">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-4 ml-auto" />
      </div>
      <div className="space-y-2">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}
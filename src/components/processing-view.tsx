"use client";

import type { StepEvent } from "@/lib/state-machine/types";
import { StepIndicator } from "./step-indicator";
import { ReasoningTimeline } from "./reasoning-timeline";
import Link from "next/link";
import { Button } from "./ui/button";

interface ProcessingViewProps {
  events: StepEvent[];
  isDone: boolean;
  error: string | null;
  onComplete?: () => void;
}

export function ProcessingView({ events, isDone, error, onComplete }: ProcessingViewProps) {
  if (events.length === 0 && !error) return null;

  const taskIds = new Set(events.filter((e) => !e.taskId.startsWith("pipeline")).map((e) => e.taskId));
  const hasCompleted = events.some((e) => e.status === "completed" && e.stepName === "action-plan");

  return (
    <div className="mt-8 space-y-4 fade-in">
      <div className="rounded-xl bg-white shadow-card p-6">
        <h3 className="text-[15px] font-semibold text-neutral-900 mb-5">
          Pipeline Progress
        </h3>
        <StepIndicator events={events} />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 shadow-card p-4 ring-1 ring-inset ring-red-200/60">
          <p className="text-[15px] text-red-700">{error}</p>
        </div>
      )}

      {isDone && !error && (
        <div className="rounded-xl bg-emerald-50 shadow-card p-4 flex items-center justify-between ring-1 ring-inset ring-emerald-200/60">
          <p className="text-[15px] text-emerald-800 font-medium">
            {hasCompleted
              ? `Analysis complete \u2014 ${taskIds.size} task${taskIds.size !== 1 ? "s" : ""} processed.`
              : "Pipeline finished."}
          </p>
          {onComplete ? (
            <Button variant="secondary" size="sm" onClick={onComplete}>
              Close
            </Button>
          ) : (
            <Link href="/tasks">
              <Button variant="secondary" size="sm">
                View Tasks \u2192
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white shadow-card p-6">
        <h3 className="text-[15px] font-semibold text-neutral-900 mb-3">
          Reasoning Log
          {taskIds.size > 0 && (
            <span className="ml-2 text-neutral-400 font-normal">
              {taskIds.size} task{taskIds.size !== 1 ? "s" : ""}
            </span>
          )}
        </h3>
        <ReasoningTimeline events={events} collapsed={isDone} />
      </div>
    </div>
  );
}

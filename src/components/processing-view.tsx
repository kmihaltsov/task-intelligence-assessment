"use client";

import type { StepEvent } from "@/lib/state-machine/types";
import { StepIndicator } from "./step-indicator";
import { ReasoningTimeline } from "./reasoning-timeline";
import Link from "next/link";
import { Button } from "./ui/button";

interface ProcessingViewProps {
  events: StepEvent[];
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
}

/**
 * Real-time processing display shown while SSE streams.
 * The pipeline view is the product's signature — not a loading screen.
 */
export function ProcessingView({ events, isStreaming, isDone, error }: ProcessingViewProps) {
  if (events.length === 0 && !error) return null;

  const taskIds = new Set(events.filter((e) => e.taskId !== "pipeline").map((e) => e.taskId));
  const hasCompleted = events.some((e) => e.status === "completed" && e.stepName === "action-plan");

  return (
    <div className="mt-8 space-y-4 fade-in">
      {/* Step progress — primary surface */}
      <div className="rounded-xl bg-white shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-neutral-900">
            Pipeline Progress
          </h3>
          {isStreaming && (
            <span className="flex items-center gap-2 text-xs text-intel-600 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-intel-400 intel-pulse" />
              Analyzing
            </span>
          )}
        </div>
        <StepIndicator events={events} />
      </div>

      {/* Reasoning timeline — secondary surface */}
      <div className="rounded-xl bg-white shadow-card p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Reasoning Log
          {taskIds.size > 0 && (
            <span className="ml-2 text-neutral-400 font-normal">
              {taskIds.size} task{taskIds.size !== 1 ? "s" : ""}
            </span>
          )}
        </h3>
        <ReasoningTimeline events={events} defaultExpanded />
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-red-50 shadow-card p-4 ring-1 ring-inset ring-red-200/60">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Completion state */}
      {isDone && !error && (
        <div className="rounded-xl bg-emerald-50 shadow-card p-4 flex items-center justify-between ring-1 ring-inset ring-emerald-200/60">
          <p className="text-sm text-emerald-800 font-medium">
            {hasCompleted
              ? `Analysis complete \u2014 ${taskIds.size} task${taskIds.size !== 1 ? "s" : ""} processed.`
              : "Pipeline finished."}
          </p>
          <Link href="/tasks">
            <Button variant="secondary" size="sm">
              View Tasks \u2192
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
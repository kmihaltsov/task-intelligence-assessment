"use client";

import type { StepEvent } from "@/lib/state-machine/types";

const PIPELINE_STEPS = [
  { name: "parse", label: "Parse" },
  { name: "categorize", label: "Categorize" },
  { name: "prioritize", label: "Prioritize" },
  { name: "action-plan", label: "Action Plan" },
];

interface StepIndicatorProps {
  events: StepEvent[];
}

type StepState = "pending" | "running" | "completed" | "failed" | "retrying";

function getStepState(stepName: string, events: StepEvent[]): StepState {
  const stepEvents = events.filter((e) => e.stepName === stepName);
  if (stepEvents.length === 0) return "pending";

  if (stepEvents.some((e) => e.status === "failed")) return "failed";
  if (stepEvents.some((e) => e.status === "completed")) return "completed";
  if (stepEvents.some((e) => e.status === "retrying")) return "retrying";
  if (stepEvents.some((e) => e.status === "running")) return "running";
  return "pending";
}

const stateStyles: Record<StepState, { dot: string; text: string; line: string }> = {
  pending: {
    dot: "bg-neutral-300",
    text: "text-neutral-400",
    line: "bg-neutral-200",
  },
  running: {
    dot: "bg-intel-400 intel-pulse",
    text: "text-intel-700 font-medium",
    line: "bg-neutral-200",
  },
  retrying: {
    dot: "bg-orange-500 ring-4 ring-orange-100 animate-pulse",
    text: "text-orange-700 font-medium",
    line: "bg-neutral-200",
  },
  completed: {
    dot: "bg-emerald-500",
    text: "text-neutral-700",
    line: "bg-emerald-400",
  },
  failed: {
    dot: "bg-red-500",
    text: "text-red-600 font-medium",
    line: "bg-red-200",
  },
};

/**
 * Horizontal 4-step progress bar showing pipeline state.
 * Uses amber intelligence pulse for active steps.
 */
export function StepIndicator({ events }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 w-full">
      {PIPELINE_STEPS.map((step, i) => {
        const state = getStepState(step.name, events);
        const styles = stateStyles[state];
        const isLast = i === PIPELINE_STEPS.length - 1;

        return (
          <div key={step.name} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${styles.dot}`}>
                {state === "completed" && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className={`text-[13px] whitespace-nowrap transition-colors ${styles.text}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-2 mt-[-14px] transition-colors duration-500 ${styles.line}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
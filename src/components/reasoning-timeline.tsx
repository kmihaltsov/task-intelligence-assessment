"use client";

import { useState } from "react";
import type { StepEvent, StepStatus } from "@/lib/state-machine/types";

interface ReasoningTimelineProps {
  events: StepEvent[];
  defaultExpanded?: boolean;
  collapsed?: boolean;
}

const statusIcons: Record<StepStatus, { icon: string; color: string }> = {
  pending: { icon: "\u25CB", color: "text-neutral-400" },
  running: { icon: "\u25C9", color: "text-intel-500" },
  retrying: { icon: "\u21BB", color: "text-orange-500" },
  completed: { icon: "\u2713", color: "text-emerald-600" },
  failed: { icon: "\u2717", color: "text-red-500" },
};

/**
 * Collapsible event timeline showing step-by-step reasoning.
 * Uses amber/intelligence tokens for active analysis moments.
 */
export function ReasoningTimeline({ events, defaultExpanded = false, collapsed }: ReasoningTimelineProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const isExpanded = collapsed ? false : expanded;

  if (events.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M4 2l4 4-4 4" />
        </svg>
        {events.length} reasoning step{events.length !== 1 ? "s" : ""}
      </button>

      {isExpanded && (
        <div className="mt-2 ml-1.5 border-l-2 border-neutral-200 pl-3 space-y-1 fade-in">
          {events.map((event, i) => {
            const { icon, color } = statusIcons[event.status];
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`font-mono ${color} mt-0.5`}>{icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-neutral-600">{event.message}</span>
                  {event.data && (
                    <span className="ml-2 font-mono text-neutral-400">
                      {Object.entries(event.data)
                        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                        .join(" ")}
                    </span>
                  )}
                </div>
                <span className="text-neutral-300 font-mono shrink-0">
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
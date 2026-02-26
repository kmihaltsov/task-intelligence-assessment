"use client";

import { useState, useRef, useEffect } from "react";
import type { TaskStatus } from "@/lib/types";

interface StatusSelectProps {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string; bg: string; activeBg: string }> = {
  backlog: {
    label: "Backlog",
    dot: "bg-neutral-400",
    bg: "hover:bg-neutral-50",
    activeBg: "bg-neutral-50",
  },
  "in-progress": {
    label: "In Progress",
    dot: "bg-accent-500",
    bg: "hover:bg-accent-50",
    activeBg: "bg-accent-50",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    bg: "hover:bg-emerald-50",
    activeBg: "bg-emerald-50",
  },
};

const OPTIONS: TaskStatus[] = ["backlog", "in-progress", "completed"];

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const config = STATUS_CONFIG[value];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-100 transition-colors w-full"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
        <span className="truncate">{config.label}</span>
        <svg className="w-3 h-3 text-neutral-400 shrink-0 ml-auto" viewBox="0 0 12 12" fill="currentColor">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-md ring-1 ring-neutral-200/60 py-1 z-50 fade-in">
          {OPTIONS.map((opt) => {
            const c = STATUS_CONFIG[opt];
            const selected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-[13px] transition-colors ${selected ? c.activeBg + " font-medium" : c.bg + " text-neutral-600"}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                {c.label}
                {selected && (
                  <svg className="w-3 h-3 ml-auto text-neutral-400" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2 6l3 3 5-5" strokeWidth="0" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import type { TaskItem, TaskStatus, ActionPlan } from "@/lib/types";
import { StatusSelect } from "./ui/status-select";
import { InlineEditField } from "./inline-edit-field";
import { ReasoningTimeline } from "./reasoning-timeline";
import { Button } from "./ui/button";

const COMPLEXITY_OPTIONS: ActionPlan["estimatedComplexity"][] = [
  "trivial", "simple", "moderate", "complex", "very_complex",
];

interface TaskDetailPanelProps {
  task: TaskItem;
  onClose: () => void;
  onUpdate: (id: string, patch: Record<string, unknown>) => Promise<TaskItem | null>;
  onDelete: (id: string) => Promise<boolean>;
}

function ExecutionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string }> = {
    created: { dot: "bg-neutral-400", text: "text-neutral-500" },
    categorized: { dot: "bg-accent-400", text: "text-accent-600" },
    prioritized: { dot: "bg-violet-400", text: "text-violet-600" },
    completed: { dot: "bg-emerald-400", text: "text-emerald-600" },
    failed: { dot: "bg-red-400", text: "text-red-600" },
  };

  const c = config[status] ?? config.created;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export function TaskDetailPanel({ task, onClose, onUpdate, onDelete }: TaskDetailPanelProps) {
  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleStatusChange(value: TaskStatus) {
    onUpdate(task.id, { status: value });
  }

  function handleDescriptionChange(value: string) {
    onUpdate(task.id, { description: value });
  }

  function handleDomainChange(value: string) {
    onUpdate(task.id, { domain: value });
  }

  function handleComplexityChange(value: string) {
    const normalized = value.toLowerCase().replace(/\s+/g, "_");
    if (COMPLEXITY_OPTIONS.includes(normalized as ActionPlan["estimatedComplexity"])) {
      onUpdate(task.id, {
        actionPlan: { ...task.actionPlan, estimatedComplexity: normalized },
      });
    }
  }

  async function handleDelete() {
    const ok = await onDelete(task.id);
    if (ok) onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-lg z-50 flex flex-col slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-neutral-100">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-neutral-900 leading-snug">
              {task.title}
            </h2>
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <StatusSelect value={task.status} onChange={handleStatusChange} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Description — always visible, editable */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Description</span>
            <EditableDescription
              value={task.description}
              onSave={handleDescriptionChange}
            />
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Domain</span>
              <p className="text-xs text-neutral-600 mt-0.5">
                <InlineEditField value={task.domain || "—"} onSave={handleDomainChange} />
              </p>
            </div>
            {task.actionPlan && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Complexity</span>
                <p className="text-xs text-neutral-600 mt-0.5 capitalize">
                  <InlineEditField
                    value={task.actionPlan.estimatedComplexity.replace("_", " ")}
                    onSave={handleComplexityChange}
                  />
                </p>
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Pipeline</span>
              <p className="mt-0.5"><ExecutionStatusBadge status={task.executionStatus} /></p>
            </div>
            {task.priority && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Score</span>
                <p className="text-xs font-mono text-neutral-600 mt-0.5">{task.priority.score}/10</p>
              </div>
            )}
          </div>

          {/* Action plan */}
          {task.actionPlan && (
            <div className="rounded-lg bg-ground-50 ring-1 ring-neutral-100 p-3">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-1">Action Plan</p>
              {task.actionPlan.summary && (
                <p className="text-xs text-neutral-500 mb-2">{task.actionPlan.summary}</p>
              )}
              <ol className="space-y-1.5">
                {task.actionPlan.steps.map((step) => (
                  <li key={step.order} className="flex gap-2 text-xs">
                    <span className="text-neutral-300 font-mono shrink-0 w-4 text-right tabular-nums">{step.order}.</span>
                    <div className="min-w-0">
                      <span className="font-medium text-neutral-700">{step.action}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* URLs */}
          {task.urls.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-1.5">Referenced URLs</p>
              <ul className="space-y-0.5">
                {task.urls.map((url, i) => (
                  <li key={i} className="text-xs text-accent-600 hover:text-accent-700 truncate transition-colors">
                    {url}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning timeline */}
          {task.events && task.events.length > 0 && (
            <div className="pt-3 border-t border-neutral-100/80">
              <ReasoningTimeline events={task.events} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[10px] text-neutral-300 font-mono tabular-nums">
            {new Date(task.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-neutral-400 hover:text-red-500 text-xs"
          >
            Delete
          </Button>
        </div>
      </div>
    </>
  );
}

function EditableDescription({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(draft.length, draft.length);
    }
  }, [editing, draft.length]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function save() {
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
          if (e.key === "Enter" && e.metaKey) save();
        }}
        rows={4}
        className="mt-1 w-full text-sm text-neutral-700 leading-relaxed rounded-md ring-1 ring-accent-300 px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-y"
        placeholder="Add a description..."
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className="mt-1 text-sm leading-relaxed rounded-md px-2.5 py-2 -mx-2.5 cursor-pointer hover:bg-neutral-50 transition-colors whitespace-pre-wrap"
      title="Click to edit"
    >
      {value || <span className="text-neutral-400 italic">Add a description...</span>}
    </p>
  );
}

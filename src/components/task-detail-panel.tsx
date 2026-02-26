"use client";

import { useEffect, useState, useRef } from "react";
import type { TaskItem, TaskStatus, ActionPlan } from "@/lib/types";
import { StatusSelect } from "./ui/status-select";
import { InlineEditField } from "./inline-edit-field";
import { ReasoningTimeline } from "./reasoning-timeline";
import { Button } from "./ui/button";
import { Badge, priorityVariant } from "./ui/badge";

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
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll while panel is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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
        className="fixed inset-0 bg-neutral-950/15 z-40 backdrop-fade"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-panel z-50 flex flex-col slide-in-right">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 bg-ground-50/80">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-neutral-900 leading-snug">
                {task.title}
              </h2>
              <div className="flex items-center gap-3 mt-3">
                <div onClick={(e) => e.stopPropagation()}>
                  <StatusSelect value={task.status} onChange={handleStatusChange} />
                </div>
                {task.priority && (
                  <Badge variant={priorityVariant(task.priority.priority)}>
                    {task.priority.priority}
                  </Badge>
                )}
                {task.category && (
                  <Badge variant="accent">
                    {task.category.category}
                  </Badge>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 -mr-2 -mt-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description — always visible, editable */}
          <div>
            <Label>Description</Label>
            <EditableDescription
              value={task.description}
              onSave={handleDescriptionChange}
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <div>
              <Label>Domain</Label>
              <p className="text-xs text-neutral-600 mt-1">
                <InlineEditField value={task.domain || "—"} onSave={handleDomainChange} />
              </p>
            </div>
            {task.actionPlan && (
              <div>
                <Label>Complexity</Label>
                <p className="text-xs text-neutral-600 mt-1 capitalize">
                  <InlineEditField
                    value={task.actionPlan.estimatedComplexity.replace("_", " ")}
                    onSave={handleComplexityChange}
                  />
                </p>
              </div>
            )}
            <div>
              <Label>Pipeline</Label>
              <p className="mt-1"><ExecutionStatusBadge status={task.executionStatus} /></p>
            </div>
            {task.priority && (
              <div>
                <Label>Score</Label>
                <p className="text-xs font-mono text-neutral-600 mt-1">{task.priority.score}/10</p>
              </div>
            )}
          </div>

          {/* Action plan */}
          {task.actionPlan && (
            <div className="rounded-xl bg-ground-50 shadow-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-2">Action Plan</p>
              {task.actionPlan.summary && (
                <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{task.actionPlan.summary}</p>
              )}
              <ol className="space-y-2">
                {task.actionPlan.steps.map((step) => (
                  <li key={step.order} className="flex gap-2.5 text-xs">
                    <span className="text-neutral-300 font-mono shrink-0 w-4 text-right tabular-nums mt-px">{step.order}.</span>
                    <span className="text-neutral-700 leading-relaxed">{step.action}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* URLs */}
          {task.urls.length > 0 && (
            <div>
              <Label>Referenced URLs</Label>
              <ul className="mt-1.5 space-y-1">
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
            <div className="pt-4 mt-2 border-t border-ground-200/60">
              <ReasoningTimeline events={task.events} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-ground-50/60 flex items-center justify-between">
          <span className="text-[10px] text-neutral-400 font-mono tabular-nums">
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
      {children}
    </span>
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
        className="mt-1.5 w-full text-sm text-neutral-700 leading-relaxed rounded-xl shadow-card px-3.5 py-2.5 bg-white focus:outline-none focus:shadow-card-hover resize-y"
        placeholder="Add a description..."
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="mt-1.5 text-sm leading-relaxed rounded-lg px-3.5 py-2.5 cursor-pointer hover:bg-ground-100/80 transition-colors whitespace-pre-wrap min-h-[2.5rem] flex items-start"
      title="Click to edit"
    >
      {value || <span className="text-neutral-400">Add a description...</span>}
    </div>
  );
}
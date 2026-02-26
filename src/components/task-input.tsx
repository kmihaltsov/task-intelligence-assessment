"use client";

import { useState } from "react";
import { Button } from "./ui/button";

interface TaskInputProps {
  onSubmit: (tasks: string[]) => void;
  disabled?: boolean;
}

/**
 * Textarea + submit for raw task input. Supports bulk input (newline-separated).
 */
export function TaskInput({ onSubmit, disabled }: TaskInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    const tasks = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (tasks.length === 0) return;
    onSubmit(tasks);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const taskCount = value
    .split("\n")
    .filter((line) => line.trim().length > 0).length;

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Enter project tasks, one per line...\n\nExamples:\nSet up CI/CD pipeline for the monorepo\nDesign and implement the login page\nMigrate database from MySQL to Postgres`}
        className="w-full min-h-[160px] rounded-xl bg-white shadow-card px-4 py-3
          text-sm text-neutral-900 placeholder:text-neutral-400
          focus:shadow-card-hover focus:ring-2 focus:ring-accent-500/20 focus:outline-none
          resize-y transition-all duration-200"
        disabled={disabled}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          {taskCount > 0 ? `${taskCount} task${taskCount !== 1 ? "s" : ""} detected` : "One task per line"}
          {" \u00B7 \u2318+Enter to submit"}
        </p>
        <Button onClick={handleSubmit} disabled={disabled || taskCount === 0}>
          {disabled ? "Processing..." : `Analyze ${taskCount > 0 ? taskCount : ""} task${taskCount !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
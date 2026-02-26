"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface TaskInputProps {
  onSubmit: (tasks: string[]) => void;
  disabled?: boolean;
  clearSignal?: number;
}

export function TaskInput({ onSubmit, disabled, clearSignal }: TaskInputProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (clearSignal) setValue("");
  }, [clearSignal]);

  function parseLines(): string[] {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  function handleSubmit() {
    const tasks = parseLines();
    if (tasks.length === 0) return;
    onSubmit(tasks);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const taskCount = parseLines().length;

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Enter project tasks, one per line...\n\nExamples:\nSet up CI/CD pipeline for the monorepo\nDesign and implement the login page\nMigrate database from MySQL to Postgres`}
        className="w-full min-h-[160px] rounded-xl bg-white shadow-card px-4 py-3
          text-[15px] text-neutral-900 placeholder:text-neutral-400
          focus:shadow-card-hover focus:ring-2 focus:ring-accent-500/20 focus:outline-none
          resize-y transition-all duration-200"
        disabled={disabled}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-neutral-400 hidden sm:block">
          {taskCount > 0 ? `${taskCount} task${taskCount !== 1 ? "s" : ""} detected` : "One task per line"}
          {" \u00B7 \u2318+Enter"}
        </p>
        <p className="text-[13px] text-neutral-400 sm:hidden">
          {taskCount > 0 ? `${taskCount} task${taskCount !== 1 ? "s" : ""}` : "One per line"}
        </p>
        <Button className="shrink-0 whitespace-nowrap" onClick={handleSubmit} disabled={disabled || taskCount === 0}>
          {disabled ? "Processing..." : `Analyze${taskCount > 0 ? ` ${taskCount}` : ""}`}
        </Button>
      </div>
    </div>
  );
}
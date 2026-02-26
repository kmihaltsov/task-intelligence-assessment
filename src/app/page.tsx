"use client";

import { TaskInput } from "@/components/task-input";
import { ProcessingView } from "@/components/processing-view";
import { useTaskStream } from "@/hooks/use-task-stream";

export default function HomePage() {
  const { events, isStreaming, isDone, error, submit } = useTaskStream();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Submit Tasks</h1>
      <p className="text-neutral-500 mb-8 text-sm">
        Enter raw project tasks for AI-powered categorization, prioritization, and action planning.
      </p>

      <TaskInput onSubmit={submit} disabled={isStreaming} />

      <ProcessingView
        events={events}
        isStreaming={isStreaming}
        isDone={isDone}
        error={error}
      />
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { mutate as globalMutate } from "swr";
import { TaskInput } from "./task-input";
import { ProcessingView } from "./processing-view";
import { useTaskStream } from "@/hooks/use-task-stream";

interface SubmitTasksModalProps {
  onClose: () => void;
}

export function SubmitTasksModal({ onClose }: SubmitTasksModalProps) {
  const { events, isStreaming, isDone, error, submit } = useTaskStream();
  const [clearSignal, setClearSignal] = useState(0);

  useEffect(() => {
    if (isDone) setClearSignal((s) => s + 1);
  }, [isDone]);

  function handleClose() {
    if (isStreaming) return;
    if (isDone) {
      globalMutate((k) => typeof k === "string" && k.startsWith("/api/tasks?"));
    }
    onClose();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isStreaming) {
        if (isDone) {
          globalMutate((k) => typeof k === "string" && k.startsWith("/api/tasks?"));
        }
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isStreaming, isDone, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start sm:justify-center sm:pt-[10vh]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={isStreaming ? undefined : handleClose}
      />

      <div className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[80vh] overflow-y-auto scrollbar-none bg-ground-50 shadow-xl sm:rounded-2xl sm:ring-1 sm:ring-neutral-200/50 fade-in flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 bg-ground-50 border-b border-neutral-200/60">
          <h2 className="text-lg font-semibold text-neutral-900">Add Tasks</h2>
          <button
            onClick={isStreaming ? undefined : handleClose}
            disabled={isStreaming}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-2">
          <TaskInput onSubmit={submit} disabled={isStreaming} clearSignal={clearSignal} />

          <ProcessingView
            events={events}
            isDone={isDone}
            error={error}
            onComplete={handleClose}
          />
        </div>
      </div>
    </div>
  );
}

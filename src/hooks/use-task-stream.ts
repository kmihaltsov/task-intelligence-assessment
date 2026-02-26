"use client";

import { useState, useCallback, useRef } from "react";
import type { StepEvent } from "@/lib/state-machine/types";

interface TaskStreamState {
  events: StepEvent[];
  isStreaming: boolean;
  error: string | null;
  isDone: boolean;
}

/**
 * SSE consumer hook using fetch + ReadableStream (not EventSource, since we need POST).
 * Parses SSE lines and returns events as they arrive.
 */
export function useTaskStream() {
  const [state, setState] = useState<TaskStreamState>({
    events: [],
    isStreaming: false,
    error: null,
    isDone: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(async (tasks: string[]) => {
    // Reset state
    setState({ events: [], isStreaming: true, error: null, isDone: false });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            setState((prev) => ({ ...prev, isStreaming: false, isDone: true }));
            return;
          }

          try {
            const event: StepEvent = JSON.parse(data);
            setState((prev) => ({
              ...prev,
              events: [...prev.events, event],
            }));
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      setState((prev) => ({ ...prev, isStreaming: false, isDone: true }));
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error.message : "Stream failed",
      }));
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return { ...state, submit, cancel };
}

/** Shared state key constants used across pipeline steps */
export const STATE_KEYS = {
  /** Original user text input */
  RAW_INPUT: "rawInput",
  /** TaskItem[] — the task list created by ParseStep, updated by subsequent steps */
  TASKS: "tasks",
} as const;

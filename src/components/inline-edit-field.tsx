"use client";

import { useState, useRef, useEffect } from "react";

interface InlineEditFieldProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
}

/**
 * Generic inline edit: click to edit, blur/enter to save, escape to cancel.
 */
export function InlineEditField({
  value,
  onSave,
  className = "",
  inputClassName = "",
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function save() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        className={`ring-1 ring-accent-300 rounded px-1.5 py-0.5 text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-accent-500/20 ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-neutral-100 rounded px-1 -mx-1 transition-colors ${className}`}
      title="Click to edit"
    >
      {value}
    </span>
  );
}
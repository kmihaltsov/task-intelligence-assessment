"use client";

interface FilterBarProps {
  category: string;
  priority: string;
  onCategoryChange: (category: string) => void;
  onPriorityChange: (priority: string) => void;
}

const CATEGORIES = [
  "Frontend",
  "Backend",
  "Infrastructure",
  "Design",
  "DevOps",
  "Data",
  "Security",
  "Testing",
  "Documentation",
  "Project Management",
];

const PRIORITIES = ["critical", "high", "medium", "low"];

export function FilterBar({
  category,
  priority,
  onCategoryChange,
  onPriorityChange,
}: FilterBarProps) {
  const hasFilters = !!(category || priority);

  return (
    <div className="flex items-center gap-2">
      <FilterSelect
        value={category}
        onChange={onCategoryChange}
        options={[
          { value: "", label: "All categories" },
          ...CATEGORIES.map((c) => ({ value: c, label: c })),
        ]}
        active={!!category}
      />
      <FilterSelect
        value={priority}
        onChange={onPriorityChange}
        options={[
          { value: "", label: "All priorities" },
          ...PRIORITIES.map((p) => ({
            value: p,
            label: p.charAt(0).toUpperCase() + p.slice(1),
          })),
        ]}
        active={!!priority}
      />

      {hasFilters && (
        <button
          onClick={() => { onCategoryChange(""); onPriorityChange(""); }}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors ml-1"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  active,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  active: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        rounded-lg pl-3 pr-8 py-2 text-[13px] font-medium transition-all cursor-pointer appearance-none
        bg-[length:16px_16px] bg-[position:right_0.375rem_center] bg-no-repeat
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20d%3D%22M4.22%206.22a.75.75%200%200%201%201.06%200L8%208.94l2.72-2.72a.75.75%200%201%201%201.06%201.06l-3.25%203.25a.75.75%200%200%201-1.06%200L4.22%207.28a.75.75%200%200%201%200-1.06z%22%2F%3E%3C%2Fsvg%3E')]
        focus:ring-2 focus:ring-accent-500/20 focus:outline-none
        ${active
          ? "bg-accent-50 text-accent-700 ring-1 ring-accent-200/60"
          : "bg-white text-neutral-600 ring-1 ring-neutral-200/60 hover:ring-neutral-300"
        }
      `}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

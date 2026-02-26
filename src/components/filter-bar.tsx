"use client";

interface FilterBarProps {
  category: string;
  priority: string;
  onCategoryChange: (category: string) => void;
  onPriorityChange: (priority: string) => void;
}

const CATEGORIES = [
  "",
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

const PRIORITIES = ["", "critical", "high", "medium", "low"];

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
          ...CATEGORIES.filter(Boolean).map((c) => ({ value: c, label: c })),
        ]}
        active={!!category}
      />
      <FilterSelect
        value={priority}
        onChange={onPriorityChange}
        options={[
          { value: "", label: "All priorities" },
          ...PRIORITIES.filter(Boolean).map((p) => ({
            value: p,
            label: p.charAt(0).toUpperCase() + p.slice(1),
          })),
        ]}
        active={!!priority}
      />

      {hasFilters && (
        <button
          onClick={() => { onCategoryChange(""); onPriorityChange(""); }}
          className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors ml-1"
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
        rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer
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

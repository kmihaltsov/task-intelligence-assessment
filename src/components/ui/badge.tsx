import { HTMLAttributes } from "react";

type BadgeVariant = "default" | "critical" | "high" | "medium" | "low" | "accent" | "intel";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-neutral-100 text-neutral-600",
  critical: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/60",
  high: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200/60",
  medium: "bg-intel-50 text-intel-700 ring-1 ring-inset ring-intel-200/60",
  low: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60",
  accent: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200/60",
  intel: "bg-intel-50 text-intel-700 ring-1 ring-inset ring-intel-200/60",
};

const priorityVariantMap: Record<string, BadgeVariant> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-md px-2 py-0.5 text-[13px] font-medium
        ${variantStyles[variant]} ${className}
      `}
      {...props}
    />
  );
}

export function priorityVariant(priority?: string): BadgeVariant {
  return priorityVariantMap[priority?.toLowerCase() ?? ""] ?? "default";
}
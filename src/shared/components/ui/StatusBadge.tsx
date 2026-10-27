import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "active"
  | "closed"
  | "cancelled"
  | "deserted";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  status?: string;
  label?: string;
  dot?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<StatusVariant, { badge: string; dot: string }> = {
  default: {
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  neutral: {
    badge: "bg-secondary text-secondary-foreground border-border",
    dot: "bg-secondary-foreground",
  },
  success: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  active: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  warning: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  danger: {
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  cancelled: {
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  info: {
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    dot: "bg-sky-500",
  },
  closed: {
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-500",
  },
  deserted: {
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    dot: "bg-orange-500",
  },
};

export function StatusBadge({
  variant,
  status,
  label,
  dot = true,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const resolvedVariant = (status?.toLowerCase() as StatusVariant) || variant || "default";
  const styles = variantStyles[resolvedVariant] || variantStyles.default;
  const displayLabel = children || label || status || resolvedVariant;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight transition-colors uppercase font-mono text-[10px]",
        styles.badge,
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} aria-hidden="true" />}
      {displayLabel}
    </span>
  );
}

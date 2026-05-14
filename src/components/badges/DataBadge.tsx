import clsx from "clsx";
import { DATA_STATUS } from "@/lib/dataStatus";
import { tone } from "@/lib/tone";
import type { DataStatus } from "@/lib/types";

interface DataBadgeProps {
  status: DataStatus;
  size?: "sm" | "md";
  /** Use the compact label ("Fallback") instead of the full one. */
  compact?: boolean;
  className?: string;
}

/**
 * The honesty primitive of the whole dashboard — every card / chart / table
 * renders one of these so live and mock data are never silently mixed.
 */
export function DataBadge({
  status,
  size = "md",
  compact = false,
  className,
}: DataBadgeProps) {
  const cfg = DATA_STATUS[status];
  const t = tone(cfg.tone);
  return (
    <span
      title={cfg.description}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        t.fill,
        t.border,
        t.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          t.dot,
          status === "live" && "animate-pulse-dot",
        )}
      />
      {compact ? cfg.short : cfg.label}
    </span>
  );
}

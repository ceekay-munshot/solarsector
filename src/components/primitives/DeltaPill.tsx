import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatSignedPct } from "@/lib/format";

interface DeltaPillProps {
  /** Percentage change. Undefined renders nothing. */
  value?: number;
  label?: string;
  /** When true, a decrease is "good" (e.g. falling tariffs) and shows green. */
  invertGood?: boolean;
  size?: "sm" | "md";
}

/** Coloured +/- change pill used on KPI cards and stat tiles. */
export function DeltaPill({
  value,
  label,
  invertGood = false,
  size = "md",
}: DeltaPillProps) {
  if (value === undefined || Number.isNaN(value)) return null;
  const flat = value === 0;
  const good = invertGood ? value < 0 : value > 0;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-md font-semibold num",
        size === "sm" ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-xs",
        flat
          ? "bg-white/5 text-faint"
          : good
            ? "bg-emerald/10 text-emerald"
            : "bg-red/10 text-red",
      )}
    >
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {formatSignedPct(value)}
      {label && <span className="ml-0.5 font-normal text-faint">{label}</span>}
    </span>
  );
}

import { Clock } from "lucide-react";
import { formatFreshness, formatTimestamp } from "@/lib/format";

interface FreshnessBadgeProps {
  iso?: string;
  label?: string;
}

/** "Checked 2h ago" — relative recency of the last fetch attempt. */
export function FreshnessBadge({ iso, label = "Checked" }: FreshnessBadgeProps) {
  return (
    <span
      title={iso ? formatTimestamp(iso) : "Not yet fetched"}
      className="inline-flex items-center gap-1 text-[11px] text-faint"
    >
      <Clock className="h-3 w-3" />
      {label} {formatFreshness(iso)}
    </span>
  );
}

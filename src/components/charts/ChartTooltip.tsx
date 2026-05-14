"use client";

interface TooltipPayloadEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  /** Formats each numeric value for display. */
  formatter?: (value: number, name: string) => string;
  /** Override the heading line. */
  labelFormatter?: (label: string | number) => string;
  /** Drop rows whose value is 0 — useful for stacked mixes. */
  hideZero?: boolean;
}

/** Theme-styled replacement for the default Recharts tooltip. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  hideZero,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = hideZero
    ? payload.filter((p) => Number(p.value) !== 0)
    : payload;
  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/12 bg-surface/95 px-3 py-2 shadow-2xl backdrop-blur-sm">
      {label !== undefined && label !== "" && (
        <div className="mb-1.5 text-[11px] font-semibold text-faint">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {rows.map((entry, i) => (
          <div
            key={`${entry.dataKey ?? entry.name ?? i}`}
            className="flex items-center justify-between gap-5 text-xs"
          >
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: entry.color }}
              />
              {entry.name}
            </span>
            <span className="num font-semibold text-ink">
              {formatter && typeof entry.value === "number"
                ? formatter(entry.value, String(entry.name))
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

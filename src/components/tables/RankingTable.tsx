export interface RankingRow {
  id: string;
  name: string;
  /** Numeric value driving the bar width. */
  value: number;
  /** Formatted value shown at the row end. */
  displayValue: string;
  /** Optional secondary text (e.g. share, count). */
  secondary?: string;
  color?: string;
}

interface RankingTableProps {
  rows: RankingRow[];
  /** Max value for bar scaling; defaults to the largest row value. */
  maxValue?: number;
  empty?: React.ReactNode;
}

/** Leaderboard with inline magnitude bars — IPP pipelines, award rankings. */
export function RankingTable({ rows, maxValue, empty }: RankingTableProps) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  const max = maxValue ?? Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="space-y-2.5">
      {rows.map((row, i) => (
        <li key={row.id} className="flex items-center gap-3">
          <span className="num w-5 shrink-0 text-right text-xs font-semibold text-faint">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-ink">
                {row.name}
              </span>
              <span className="num shrink-0 text-sm font-semibold text-ink">
                {row.displayValue}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, (row.value / max) * 100)}%`,
                    background: row.color ?? "#f5a524",
                  }}
                />
              </div>
              {row.secondary && (
                <span className="num shrink-0 text-[11px] text-faint">
                  {row.secondary}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

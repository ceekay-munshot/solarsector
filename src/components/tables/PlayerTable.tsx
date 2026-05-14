import clsx from "clsx";

export interface PlayerColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

interface PlayerTableProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  playerName: (row: T) => string;
  /** Optional secondary line under the player name. */
  playerMeta?: (row: T) => string | undefined;
  /** Optional accent dot colour per row. */
  accent?: (row: T) => string | undefined;
  columns: PlayerColumn<T>[];
  showRank?: boolean;
  empty?: React.ReactNode;
}

/** Player-wise table: ranked player column + a set of metric columns. */
export function PlayerTable<T>({
  rows,
  rowKey,
  playerName,
  playerMeta,
  accent,
  columns,
  showRank = true,
  empty,
}: PlayerTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wider text-faint uppercase">
              {showRank ? "# Player" : "Player"}
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  "px-3 py-2.5 text-[11px] font-semibold tracking-wider whitespace-nowrap text-faint uppercase",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              className="border-b border-line-soft transition-colors last:border-0 hover:bg-white/[0.025]"
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  {showRank && (
                    <span className="num w-4 shrink-0 text-right text-xs font-semibold text-faint">
                      {i + 1}
                    </span>
                  )}
                  {accent?.(row) && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: accent(row) }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">
                      {playerName(row)}
                    </div>
                    {playerMeta?.(row) && (
                      <div className="truncate text-[11px] text-faint">
                        {playerMeta(row)}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    "px-3 py-2.5 align-middle",
                    c.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

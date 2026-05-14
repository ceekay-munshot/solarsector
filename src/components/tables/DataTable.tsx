import clsx from "clsx";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Tighter row padding. */
  dense?: boolean;
  hover?: boolean;
  /** Rendered in place of the table body when there are no rows. */
  empty?: React.ReactNode;
}

/** Generic, theme-styled data table. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  dense = false,
  hover = true,
  empty,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  "px-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-faint uppercase",
                  dense ? "py-2" : "py-2.5",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                  (!c.align || c.align === "left") && "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={clsx(
                "border-b border-line-soft last:border-0",
                hover && "transition-colors hover:bg-white/[0.025]",
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    "px-3 align-middle",
                    dense ? "py-2" : "py-2.5",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.className,
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

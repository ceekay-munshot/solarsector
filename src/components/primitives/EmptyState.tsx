import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

/** Shown when active filters exclude every row in a table or list. */
export function EmptyState({
  title = "Nothing matches these filters",
  message = "Adjust the year, quarter, player or technology filters to see results.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-faint">
        <SearchX className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="max-w-xs text-xs text-faint">{message}</p>
    </div>
  );
}

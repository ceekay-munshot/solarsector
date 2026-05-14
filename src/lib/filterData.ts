/** Helpers for applying the global filter bar to period-tagged datasets. */
import type { FilterState } from "@/components/filters/FilterContext";

/** Filter any FY + quarter tagged rows by the active FY / quarter filters. */
export function filterByPeriod<T extends { fy: string; quarter: string }>(
  rows: T[],
  filters: Pick<FilterState, "fy" | "quarter">,
): T[] {
  return rows.filter(
    (r) =>
      (filters.fy === "all" || r.fy === filters.fy) &&
      (filters.quarter === "all" || r.quarter === filters.quarter),
  );
}

/** Filter rows that only carry a fiscal year. */
export function filterByFy<T extends { fy: string }>(
  rows: T[],
  fy: string,
): T[] {
  return fy === "all" ? rows : rows.filter((r) => r.fy === fy);
}

/** Simple "all"-aware equality check used for player / technology filters. */
export function matches(value: string, filter: string): boolean {
  return filter === "all" || value === filter;
}

/** A short human summary of the active filters, for empty states / captions. */
export function describeFilters(filters: FilterState): string {
  const parts: string[] = [];
  if (filters.fy !== "all") parts.push(filters.fy);
  if (filters.quarter !== "all") parts.push(filters.quarter);
  if (filters.player !== "all") parts.push(filters.player);
  if (filters.tech !== "all") parts.push(filters.tech);
  return parts.length > 0 ? parts.join(" · ") : "all data";
}

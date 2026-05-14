"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DataStatus } from "@/lib/types";

/**
 * Global dashboard filters. State lives in React context (not the URL) so it
 * persists smoothly across tab navigation. Each page reads what it needs and
 * filters its own datasets — see usage in the page components.
 */
export interface FilterState {
  /** "all" | "FY22" … "FY26" */
  fy: string;
  /** "all" | "Q1" … "Q4" */
  quarter: string;
  /** "all" | player name */
  player: string;
  /** "all" | technology / tender type / power source */
  tech: string;
  /** "all" | "live" | "mock" | "fallback" | "pending" */
  status: string;
}

const DEFAULT_FILTERS: FilterState = {
  fy: "all",
  quarter: "all",
  player: "all",
  tech: "all",
  status: "all",
};

interface FilterContextValue extends FilterState {
  set: (patch: Partial<FilterState>) => void;
  reset: () => void;
  /** Number of filters away from their default. */
  activeCount: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FilterState>(DEFAULT_FILTERS);

  const value = useMemo<FilterContextValue>(() => {
    const activeCount = Object.values(state).filter((v) => v !== "all").length;
    return {
      ...state,
      activeCount,
      set: (patch) => setState((s) => ({ ...s, ...patch })),
      reset: () => setState(DEFAULT_FILTERS),
    };
  }, [state]);

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return ctx;
}

/**
 * True when the active data-status filter excludes the given status — cards
 * use this to de-emphasise data that doesn't match the filter, so the
 * live-vs-mock composition of any page is instantly visible.
 */
export function useStatusDim(status: DataStatus): boolean {
  const { status: filterStatus } = useFilters();
  return filterStatus !== "all" && filterStatus !== status;
}

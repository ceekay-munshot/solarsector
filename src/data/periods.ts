/**
 * Canonical period definitions for the dashboard's 5-year window: FY22–FY26
 * (Indian fiscal year, April–March). All mock datasets and live snapshots
 * align to these keys so charts/tables stay consistent across tabs.
 */
import type { Quarter, QuarterKey } from "@/lib/types";

export const FISCAL_YEARS = ["FY22", "FY23", "FY24", "FY25", "FY26"] as const;
export type FiscalYear = (typeof FISCAL_YEARS)[number];

export const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

/** All 20 quarter keys across the 5-year window, oldest first. */
export const QUARTER_KEYS: QuarterKey[] = FISCAL_YEARS.flatMap((fy, fyIdx) =>
  QUARTERS.map((quarter, qIdx) => ({
    period: `${quarter} ${fy}`,
    fy,
    quarter,
    index: fyIdx * 4 + qIdx,
  })),
);

export const PERIODS: string[] = QUARTER_KEYS.map((q) => q.period);
export const LATEST_PERIOD = PERIODS[PERIODS.length - 1]; // "Q4 FY26"
export const PREV_PERIOD = PERIODS[PERIODS.length - 2]; // "Q3 FY26"
export const LATEST_FY = FISCAL_YEARS[FISCAL_YEARS.length - 1]; // "FY26"

/** Indian-FY quarter → calendar months. */
const QUARTER_MONTHS: Record<Quarter, string[]> = {
  Q1: ["Apr", "May", "Jun"],
  Q2: ["Jul", "Aug", "Sep"],
  Q3: ["Oct", "Nov", "Dec"],
  Q4: ["Jan", "Feb", "Mar"],
};

export interface MonthKey {
  /** "Apr 21" */
  month: string;
  monthName: string;
  fy: FiscalYear;
  quarter: Quarter;
  index: number;
}

/** All 60 month keys across the 5-year window, oldest first. */
export const MONTH_KEYS: MonthKey[] = (() => {
  const keys: MonthKey[] = [];
  let index = 0;
  for (const fy of FISCAL_YEARS) {
    const fyNum = Number(fy.slice(2));
    for (const quarter of QUARTERS) {
      for (const monthName of QUARTER_MONTHS[quarter]) {
        // Q1–Q3 fall in calendar year (fyNum - 1); Q4 in fyNum.
        const calYY = quarter === "Q4" ? fyNum : fyNum - 1;
        keys.push({
          month: `${monthName} ${String(calYY).padStart(2, "0")}`,
          monthName,
          fy,
          quarter,
          index: index++,
        });
      }
    }
  }
  return keys;
})();

export const MONTHS: string[] = MONTH_KEYS.map((m) => m.month);

/** Resolve the FY for a given period string ("Q3 FY25" → "FY25"). */
export function fyOf(period: string): string {
  return period.split(" ")[1] ?? period;
}

/** Filter any period-tagged series by the active FY filter ("all" → no filter). */
export function inFyWindow<T extends { fy: string }>(
  rows: T[],
  fy: string,
): T[] {
  if (fy === "all") return rows;
  return rows.filter((r) => r.fy === fy);
}

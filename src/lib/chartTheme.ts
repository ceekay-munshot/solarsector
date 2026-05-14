/** Shared chart palette + axis styling for the Solar Command Center theme. */

export const CHART = {
  amber: "#f5a524",
  amberBright: "#ffc857",
  blue: "#38bdf8",
  blueDeep: "#3b82f6",
  emerald: "#34d399",
  emeraldDeep: "#10b981",
  violet: "#a78bfa",
  violetDeep: "#8b5cf6",
  orange: "#fb923c",
  red: "#f87171",
  cyan: "#22d3ee",
  pink: "#f472b6",
  slate: "#7986ad",
  grid: "rgba(255, 255, 255, 0.055)",
  axis: "#6b78a0",
  axisLine: "rgba(255, 255, 255, 0.08)",
  tooltipBg: "#0f1628",
  tooltipBorder: "rgba(255, 255, 255, 0.1)",
} as const;

/** Ordered palette for generic multi-series charts. */
export const SERIES_PALETTE = [
  CHART.amber,
  CHART.blue,
  CHART.emerald,
  CHART.violet,
  CHART.orange,
  CHART.cyan,
  CHART.pink,
  CHART.slate,
] as const;

/** Tender / contract technology colours — consistent across every tab. */
export const TECH_COLORS: Record<string, string> = {
  Solar: CHART.amber,
  FDRE: CHART.violet,
  Wind: CHART.blue,
  BESS: CHART.emerald,
  Hybrid: CHART.orange,
  RTC: CHART.cyan,
};

/** Power-source colours for the capacity tab. */
export const SOURCE_COLORS: Record<string, string> = {
  Solar: CHART.amber,
  Wind: CHART.blue,
  Hydro: CHART.cyan,
  Thermal: CHART.orange,
  Nuclear: CHART.pink,
  BESS: CHART.emerald,
};

/**
 * Cast a strongly-typed series array to the loose record shape the chart
 * wrappers (and Recharts) expect. Keeps page code type-safe while charts stay
 * generic.
 */
export function chartRows<T extends object>(
  rows: readonly T[],
): Array<Record<string, string | number>> {
  return rows as unknown as Array<Record<string, string | number>>;
}

/** Recharts axis prop preset — keeps every chart visually aligned. */
export const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART.axisLine },
} as const;

export const gridProps = {
  stroke: CHART.grid,
  strokeDasharray: "0",
  vertical: false,
} as const;

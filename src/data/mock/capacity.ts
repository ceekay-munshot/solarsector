/**
 * Mock dataset — quarterly capacity commissioning by power source + cumulative
 * installed base. Synthetic FY22–FY26 series until a live NPP / CEA parser is
 * built — see SOLAR_DASHBOARD_PLAN.md.
 */
import { QUARTER_KEYS } from "@/data/periods";
import { growthSeries } from "@/lib/seededRandom";
import type {
  CapacityCommissionPoint,
  CapacityCumulativePoint,
  CapacityData,
  Dataset,
} from "@/lib/types";

const n = QUARTER_KEYS.length;
// Commissioning consistently clusters into the fiscal-year-end quarter.
const seasonal = [0.86, 0.96, 1.06, 1.16];

const solar = growthSeries({ seed: 501, n, start: 1900, end: 5700, curve: "scurve", noise: 0.14, seasonal, round: 10 });
const wind = growthSeries({ seed: 502, n, start: 560, end: 1520, curve: "scurve", noise: 0.18, seasonal, round: 10 });
const hydro = growthSeries({ seed: 503, n, start: 90, end: 265, curve: "linear", noise: 0.32, round: 5 });
const thermal = growthSeries({ seed: 504, n, start: 820, end: 1240, curve: "decel", noise: 0.28, round: 10 });
// Nuclear comes in lumps as reactor units are commissioned, not a smooth ramp.
const nuclearBase = growthSeries({ seed: 505, n, start: 10, end: 60, curve: "linear", noise: 0.45, round: 5 });
const nuclear = nuclearBase.map((v, i) => (i === 7 || i === 15 ? v + 700 : v));
const bess = growthSeries({ seed: 506, n, start: 0, end: 680, curve: "accel", noise: 0.3, round: 10 });

const commissioning: CapacityCommissionPoint[] = QUARTER_KEYS.map((q, i) => ({
  period: q.period,
  fy: q.fy,
  quarter: q.quarter,
  Solar: solar[i],
  Wind: wind[i],
  Hydro: hydro[i],
  Thermal: thermal[i],
  Nuclear: nuclear[i],
  BESS: bess[i],
}));

/** Force a non-decreasing series — cumulative installed base never dips. */
function monotonic(series: number[]): number[] {
  let max = -Infinity;
  return series.map((v) => {
    max = Math.max(max, v);
    return max;
  });
}

const totalGW = monotonic(
  growthSeries({ seed: 510, n, start: 402, end: 508, curve: "linear", noise: 0.012, round: 1 }),
);
const renewableGW = monotonic(
  growthSeries({ seed: 511, n, start: 151, end: 237, curve: "scurve", noise: 0.015, round: 1 }),
);

const cumulative: CapacityCumulativePoint[] = QUARTER_KEYS.map((q, i) => ({
  period: q.period,
  fy: q.fy,
  quarter: q.quarter,
  totalGW: totalGW[i],
  renewableGW: renewableGW[i],
}));

export const capacityMock: Dataset<CapacityData> = {
  meta: {
    status: "mock",
    sourceName: "Mock dataset — capacity commissioning (v1)",
    note: "Synthetic FY22–FY26 commissioning + cumulative series. Live ingestion from NPP / CEA monthly reports is not built yet.",
  },
  value: { commissioning, cumulative },
};

/**
 * Mock dataset — all-India power demand. 60-month series (FY22–FY26) with
 * realistic summer-peak seasonality; quarterly and yearly growth are derived
 * YoY from the monthly series so the three views always reconcile. Synthetic
 * until a live POSOCO / CEA / NPP parser is built — see SOLAR_DASHBOARD_PLAN.md.
 */
import { FISCAL_YEARS, MONTH_KEYS, QUARTER_KEYS } from "@/data/periods";
import { growthSeries, pctChange } from "@/lib/seededRandom";
import type {
  DemandData,
  DemandGrowthPoint,
  DemandMonthlyPoint,
  Dataset,
} from "@/lib/types";

const n = MONTH_KEYS.length; // 60

// Month-of-FY multipliers (Apr → Mar). Summer (May/Jun) is the demand peak.
const energySeasonal = [1.06, 1.13, 1.09, 1.02, 0.98, 0.97, 1.0, 0.95, 0.96, 0.99, 0.95, 1.04];
const peakSeasonal = [1.08, 1.13, 1.1, 1.0, 0.97, 0.95, 0.96, 0.93, 0.95, 0.99, 0.97, 1.04];

const energy = growthSeries({ seed: 601, n, start: 102, end: 143, curve: "linear", noise: 0.025, seasonal: energySeasonal, round: 0.1 });
const peak = growthSeries({ seed: 602, n, start: 168, end: 224, curve: "linear", noise: 0.022, seasonal: peakSeasonal, round: 0.1 });

const monthly: DemandMonthlyPoint[] = MONTH_KEYS.map((m, i) => ({
  month: m.month,
  monthName: m.monthName,
  fy: m.fy,
  quarter: m.quarter,
  energyBU: energy[i],
  peakGW: peak[i],
  yoyPct: i >= 12 ? pctChange(energy[i], energy[i - 12]) : 0,
}));

// Quarterly energy = sum of its 3 months; growth is YoY vs the same quarter
// of the prior FY (so the first 4 quarters have no comparison base).
const quarterEnergy = QUARTER_KEYS.map((_, qi) =>
  energy.slice(qi * 3, qi * 3 + 3).reduce((acc, v) => acc + v, 0),
);
const quarterlyGrowth: DemandGrowthPoint[] = QUARTER_KEYS.slice(4).map((q, idx) => ({
  period: q.period,
  growthPct: pctChange(quarterEnergy[idx + 4], quarterEnergy[idx]),
}));

const fyEnergy = FISCAL_YEARS.map((fy) =>
  monthly.filter((m) => m.fy === fy).reduce((acc, m) => acc + m.energyBU, 0),
);
const yearlyGrowth: DemandGrowthPoint[] = FISCAL_YEARS.slice(1).map((fy, idx) => ({
  period: fy,
  growthPct: pctChange(fyEnergy[idx + 1], fyEnergy[idx]),
}));

export const demandMock: Dataset<DemandData> = {
  meta: {
    status: "mock",
    sourceName: "Mock dataset — power demand (v1)",
    note: "Synthetic FY22–FY26 monthly demand with summer-peak seasonality. Live ingestion from POSOCO / CEA / NPP is not built yet.",
  },
  value: { monthly, quarterlyGrowth, yearlyGrowth },
};

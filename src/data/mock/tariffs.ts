/**
 * Mock dataset — discovered tariffs (Rs/kWh).
 *
 * 5-year quarterly tariff trend by technology, plus latest-contract cards and
 * an awarded-bidder table. Synthetic until a live CERC / tender-result tariff
 * parser is built — see SOLAR_DASHBOARD_PLAN.md.
 */
import { QUARTER_KEYS } from "@/data/periods";
import { makeRng, roundTo } from "@/lib/seededRandom";
import type {
  Dataset,
  TariffBidderRow,
  TariffContract,
  TariffData,
  TariffTrendPoint,
} from "@/lib/types";

/** Piecewise-linear series through narrative keyframes, with seeded noise. */
function keyframeSeries(
  seed: number,
  frames: [number, number][],
  n: number,
  noise: number,
): number[] {
  const rng = makeRng(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let lo = frames[0];
    let hi = frames[frames.length - 1];
    for (let f = 0; f < frames.length - 1; f++) {
      if (i >= frames[f][0] && i <= frames[f + 1][0]) {
        lo = frames[f];
        hi = frames[f + 1];
        break;
      }
    }
    const span = hi[0] - lo[0];
    const t = span === 0 ? 0 : (i - lo[0]) / span;
    const v = (lo[1] + (hi[1] - lo[1]) * t) * (1 + (rng() - 0.5) * 2 * noise);
    out.push(roundTo(v, 0.01));
  }
  return out;
}

const n = QUARTER_KEYS.length;

// Solar dipped through the FY23 module-glut, then climbed with the cell-cost
// cycle. FDRE and BESS fell sharply as those markets matured.
const solar = keyframeSeries(401, [[0, 2.41], [4, 2.18], [9, 2.33], [14, 2.49], [19, 2.58]], n, 0.022);
const fdre = keyframeSeries(402, [[0, 4.62], [6, 4.41], [11, 3.95], [15, 3.58], [19, 3.43]], n, 0.02);
const hybrid = keyframeSeries(403, [[0, 3.05], [5, 2.96], [10, 3.18], [15, 3.42], [19, 3.55]], n, 0.022);
const bess = keyframeSeries(404, [[0, 6.85], [5, 5.6], [10, 4.35], [15, 3.25], [19, 2.95]], n, 0.03);
const rtc = keyframeSeries(405, [[0, 3.95], [5, 4.12], [10, 4.28], [14, 4.42], [19, 4.55]], n, 0.02);

const trend: TariffTrendPoint[] = QUARTER_KEYS.map((q, i) => ({
  period: q.period,
  fy: q.fy,
  quarter: q.quarter,
  Solar: solar[i],
  FDRE: fdre[i],
  Hybrid: hybrid[i],
  BESS: bess[i],
  RTC: rtc[i],
}));

const contracts: TariffContract[] = [
  { id: "C-01", title: "SECI Standalone BESS Tranche-II", agency: "SECI", tech: "BESS", tariff: 2.21, capacityMW: 1000, winner: "JSW Neo Energy", date: "Feb 2026", period: "Q4 FY26" },
  { id: "C-02", title: "NTPC CPSU Solar Tranche-IV", agency: "NTPC", tech: "Solar", tariff: 2.53, capacityMW: 1500, winner: "NTPC Green Energy", date: "Oct 2025", period: "Q3 FY26" },
  { id: "C-03", title: "SECI ISTS Solar Tranche-XVI", agency: "SECI", tech: "Solar", tariff: 2.57, capacityMW: 1200, winner: "NTPC Green Energy", date: "Feb 2026", period: "Q4 FY26" },
  { id: "C-04", title: "SJVN FDRE Tranche-I", agency: "SJVN", tech: "FDRE", tariff: 3.55, capacityMW: 1500, winner: "Avaada Energy", date: "Dec 2025", period: "Q3 FY26" },
  { id: "C-05", title: "SECI FDRE Tranche-III", agency: "SECI", tech: "FDRE", tariff: 3.42, capacityMW: 2000, winner: "ReNew", date: "Mar 2026", period: "Q4 FY26" },
  { id: "C-06", title: "SECI Solar-Wind Hybrid Tranche-IX", agency: "SECI", tech: "Hybrid", tariff: 3.49, capacityMW: 1200, winner: "Adani Green Energy", date: "Jan 2026", period: "Q4 FY26" },
  { id: "C-07", title: "NTPC RTC Power Tranche-II", agency: "NTPC", tech: "RTC", tariff: 4.38, capacityMW: 1500, winner: "Greenko", date: "Jan 2026", period: "Q4 FY26" },
  { id: "C-08", title: "SECI Wind Tranche-XV", agency: "SECI", tech: "Wind", tariff: 3.31, capacityMW: 1200, winner: "ReNew", date: "Nov 2025", period: "Q3 FY26" },
  { id: "C-09", title: "GUVNL Phase-XXIII Solar", agency: "State DISCOM", tech: "Solar", tariff: 2.61, capacityMW: 750, winner: "Tata Power Renewable", date: "Dec 2025", period: "Q3 FY26" },
  { id: "C-10", title: "NHPC ISTS Solar Rajasthan", agency: "NHPC", tech: "Solar", tariff: 2.55, capacityMW: 800, winner: "ACME Solar", date: "Nov 2025", period: "Q3 FY26" },
];

const bidders: TariffBidderRow[] = [
  { player: "JSW Neo Energy", tech: "BESS", tariff: 2.21, capacityMW: 1000, project: "SECI BESS Tranche-II", period: "Q4 FY26" },
  { player: "Sembcorp Energy India", tech: "BESS", tariff: 2.34, capacityMW: 500, project: "SECI BESS Tranche-I", period: "Q1 FY26" },
  { player: "NTPC Green Energy", tech: "Solar", tariff: 2.53, capacityMW: 1500, project: "NTPC CPSU Solar IV", period: "Q3 FY26" },
  { player: "ReNew", tech: "Solar", tariff: 2.54, capacityMW: 1800, project: "SECI ISTS Solar XIV", period: "Q4 FY25" },
  { player: "NHPC / ACME Solar", tech: "Solar", tariff: 2.55, capacityMW: 800, project: "NHPC ISTS Solar RJ", period: "Q3 FY26" },
  { player: "Adani Green Energy", tech: "Solar", tariff: 2.56, capacityMW: 2000, project: "SECI ISTS Solar XV", period: "Q2 FY26" },
  { player: "NTPC Green Energy", tech: "Solar", tariff: 2.57, capacityMW: 1200, project: "SECI ISTS Solar XVI", period: "Q4 FY26" },
  { player: "Tata Power Renewable", tech: "Solar", tariff: 2.61, capacityMW: 750, project: "GUVNL Phase-XXIII", period: "Q3 FY26" },
  { player: "ReNew", tech: "Wind", tariff: 3.31, capacityMW: 1200, project: "SECI Wind Tranche-XV", period: "Q3 FY26" },
  { player: "ReNew", tech: "FDRE", tariff: 3.42, capacityMW: 2000, project: "SECI FDRE Tranche-III", period: "Q4 FY26" },
  { player: "Adani Green Energy", tech: "Hybrid", tariff: 3.49, capacityMW: 1200, project: "SECI Hybrid Tranche-IX", period: "Q4 FY26" },
  { player: "Avaada Energy", tech: "FDRE", tariff: 3.55, capacityMW: 1500, project: "SJVN FDRE Tranche-I", period: "Q3 FY26" },
  { player: "Tata Power Renewable", tech: "FDRE", tariff: 3.58, capacityMW: 1000, project: "NTPC FDRE Tranche-I", period: "Q1 FY26" },
  { player: "Greenko", tech: "RTC", tariff: 4.38, capacityMW: 1500, project: "NTPC RTC Power II", period: "Q4 FY26" },
];

export const tariffMock: Dataset<TariffData> = {
  meta: {
    status: "mock",
    sourceName: "Mock dataset — discovered tariffs (v1)",
    note: "Synthetic FY22–FY26 tariff trend + contract book. Live tariff parsing from CERC orders / tender results is not built yet.",
  },
  value: { trend, contracts, bidders },
};

/**
 * Mock dataset — DCR (Domestic Content Requirement) module & cell production.
 *
 * 5-year quarterly series (FY22–FY26). Player-wise series are generated first;
 * the industry total is the element-wise sum, so totals and player tables are
 * always internally consistent. Replaceable by live ingestion later — see
 * SOLAR_DASHBOARD_PLAN.md for the player-wise DCR feasibility risk.
 */
import { QUARTER_KEYS } from "@/data/periods";
import type {
  Dataset,
  DcrData,
  DcrPlayerRow,
  DcrQuarterPoint,
  DcrSegment,
} from "@/lib/types";
import { growthSeries, pctChange, roundTo } from "@/lib/seededRandom";

interface PlayerSpec {
  player: string;
  seed: number;
  start: number;
  end: number;
  curve: "linear" | "scurve" | "accel" | "decel";
  noise?: number;
}

// DCR module production (MW / quarter). Starts ~1.4 GW/qtr, ramps to ~6.8 GW/qtr.
const MODULE_PLAYERS: PlayerSpec[] = [
  { player: "Waaree Energies", seed: 101, start: 280, end: 1480, curve: "scurve" },
  { player: "Adani Solar", seed: 102, start: 240, end: 1180, curve: "scurve" },
  { player: "Premier Energies", seed: 103, start: 85, end: 800, curve: "accel" },
  { player: "Tata Power Solar", seed: 104, start: 165, end: 640, curve: "decel" },
  { player: "Vikram Solar", seed: 105, start: 150, end: 575, curve: "scurve" },
  { player: "ReNew Photovoltaics", seed: 106, start: 110, end: 445, curve: "scurve" },
  { player: "Goldi Solar", seed: 107, start: 70, end: 420, curve: "accel" },
  { player: "Saatvik Solar", seed: 108, start: 40, end: 345, curve: "accel" },
  { player: "Rayzon Solar", seed: 109, start: 30, end: 310, curve: "accel" },
  { player: "Emmvee Photovoltaic", seed: 110, start: 85, end: 295, curve: "decel" },
  { player: "Other ALMM-listed", seed: 111, start: 130, end: 500, curve: "linear" },
];

// DCR cell production (MW / quarter). Cell capacity lags modules — starts
// ~0.35 GW/qtr, ramps hard from FY24 to ~3.6 GW/qtr.
const CELL_PLAYERS: PlayerSpec[] = [
  { player: "Adani Solar", seed: 201, start: 140, end: 900, curve: "scurve" },
  { player: "Premier Energies", seed: 202, start: 30, end: 730, curve: "accel" },
  { player: "Waaree Energies", seed: 203, start: 5, end: 575, curve: "accel" },
  { player: "Tata Power Solar", seed: 204, start: 95, end: 490, curve: "decel" },
  { player: "ReNew Photovoltaics", seed: 205, start: 35, end: 305, curve: "scurve" },
  { player: "Vikram Solar", seed: 206, start: 0, end: 285, curve: "accel" },
  { player: "Other integrated lines", seed: 207, start: 55, end: 360, curve: "linear" },
];

function buildSegment(
  specs: PlayerSpec[],
  segment: DcrSegment,
): { rows: DcrPlayerRow[]; totals: number[] } {
  const n = QUARTER_KEYS.length;
  const series = specs.map((s) =>
    growthSeries({
      seed: s.seed,
      n,
      start: s.start,
      end: s.end,
      curve: s.curve,
      noise: s.noise ?? 0.11,
      round: 5,
    }),
  );
  const totals = QUARTER_KEYS.map((_, i) =>
    series.reduce((acc, s) => acc + s[i], 0),
  );
  const rows: DcrPlayerRow[] = specs
    .map((spec, idx) => {
      const s = series[idx];
      return {
        player: spec.player,
        segment,
        byPeriod: QUARTER_KEYS.map((q, i) => ({ period: q.period, mw: s[i] })),
        latestMW: s[n - 1],
        ttmMW: s.slice(-4).reduce((acc, v) => acc + v, 0),
        sharePct: roundTo((s[n - 1] / totals[n - 1]) * 100, 0.1),
        qoqPct: pctChange(s[n - 1], s[n - 2]),
      };
    })
    .sort((a, b) => b.latestMW - a.latestMW);
  return { rows, totals };
}

const moduleSeg = buildSegment(MODULE_PLAYERS, "module");
const cellSeg = buildSegment(CELL_PLAYERS, "cell");

const quarterly: DcrQuarterPoint[] = QUARTER_KEYS.map((q, i) => ({
  period: q.period,
  fy: q.fy,
  quarter: q.quarter,
  moduleMW: moduleSeg.totals[i],
  cellMW: cellSeg.totals[i],
}));

export const dcrMock: Dataset<DcrData> = {
  meta: {
    status: "mock",
    sourceName: "Mock dataset — DCR module & cell production (v1)",
    note: "Synthetic FY22–FY26 quarterly series. No single public feed publishes player-wise DCR output; live ingestion feasibility is flagged as a risk in SOLAR_DASHBOARD_PLAN.md.",
  },
  value: {
    quarterly,
    modulePlayers: moduleSeg.rows,
    cellPlayers: cellSeg.rows,
  },
};

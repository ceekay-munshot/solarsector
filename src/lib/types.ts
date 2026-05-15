/**
 * Shared domain + data-provenance types for the India Solar & Power dashboard.
 *
 * Every dataset surfaced in the UI is wrapped in `Dataset<T>` so that each
 * card / chart / table can render an honest data-provenance badge. Mock data
 * and live snapshots share these shapes so a tab can be flipped from mock to
 * live ingestion later without touching the UI.
 */

/** Provenance of a dataset as shown on the UI badge. */
export type DataStatus =
  | "live" // fetched successfully from the upstream source
  | "mock" // curated mock dataset, live ingestion not built yet
  | "fallback" // live fetch was attempted and failed -> showing mock
  | "pending"; // ingestion not yet attempted / wired

/** Status of a single source-health probe. */
export type ProbeStatus = "live" | "fallback" | "probe_failed" | "pending";

export interface SourceMeta {
  status: DataStatus;
  /** Human-readable origin, e.g. "SECI Tenders" or "Mock dataset v1". */
  sourceName: string;
  sourceUrl?: string;
  /** ISO timestamp of the last fetch attempt, when applicable. */
  lastChecked?: string;
  /** Caveat, parser note, or upstream error message. */
  note?: string;
}

/** A value plus its provenance. The unit the whole dashboard is built on. */
export interface Dataset<T> {
  meta: SourceMeta;
  value: T;
}

/* ----------------------------------------------------------------------- */
/* Periods                                                                  */
/* ----------------------------------------------------------------------- */

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface QuarterKey {
  /** "Q1 FY24" */
  period: string;
  /** "FY24" */
  fy: string;
  quarter: Quarter;
  /** Sort index across the full 5-year window. */
  index: number;
}

/* ----------------------------------------------------------------------- */
/* DCR (Domestic Content Requirement) — modules & cells                      */
/* ----------------------------------------------------------------------- */

export interface DcrQuarterPoint {
  period: string;
  fy: string;
  quarter: Quarter;
  /** DCR module production, MW. */
  moduleMW: number;
  /** DCR cell production, MW. */
  cellMW: number;
}

export type DcrSegment = "module" | "cell";

export interface DcrPlayerRow {
  player: string;
  segment: DcrSegment;
  /** Production by quarter across the 5-year window, MW. */
  byPeriod: { period: string; mw: number }[];
  /** Most recent quarter production, MW. */
  latestMW: number;
  /** Trailing-four-quarter production, MW. */
  ttmMW: number;
  /** Share of the latest-quarter industry total, %. */
  sharePct: number;
  /** QoQ change for the latest quarter, %. */
  qoqPct: number;
}

export interface DcrData {
  quarterly: DcrQuarterPoint[];
  modulePlayers: DcrPlayerRow[];
  cellPlayers: DcrPlayerRow[];
}

/* ----------------------------------------------------------------------- */
/* Tenders                                                                   */
/* ----------------------------------------------------------------------- */

export type TenderTech =
  | "Solar"
  | "FDRE"
  | "Wind"
  | "BESS"
  | "Hybrid"
  | "RTC";

export type TenderAgency =
  | "SECI"
  | "NTPC"
  | "NHPC"
  | "SJVN"
  | "State DISCOM"
  | "Other";

export type TenderStage =
  | "Awarded"
  | "Under Evaluation"
  | "Bids Submitted"
  | "Announced";

export interface TenderAwardPoint {
  period: string;
  fy: string;
  quarter: Quarter;
  /** Total capacity awarded in the quarter, MW. */
  awardedMW: number;
}

/** Quarterly awarded capacity split by technology, MW. */
export interface TenderMixPoint {
  period: string;
  fy: string;
  quarter: Quarter;
  Solar: number;
  FDRE: number;
  Wind: number;
  BESS: number;
  Hybrid: number;
  RTC: number;
}

export interface TenderPlayerRow {
  player: string;
  awardedMW: number;
  tenderCount: number;
  /** Capacity-weighted average tariff, Rs/kWh. */
  avgTariff: number;
}

export interface TenderRecord {
  id: string;
  title: string;
  agency: TenderAgency;
  tech: TenderTech;
  capacityMW: number;
  stage: TenderStage;
  /** Discovered / awarded tariff, Rs/kWh (when known). */
  tariff?: number;
  winner?: string;
  state?: string;
  /** "Q3 FY25" or an ISO date when available. */
  date: string;
  period: string;
}

export interface TenderData {
  quarterlyAwards: TenderAwardPoint[];
  mix: TenderMixPoint[];
  players: TenderPlayerRow[];
  records: TenderRecord[];
}

/** Shape of the SECI live snapshot written by scripts/ingest.mjs. */
export interface SeciLiveSnapshot {
  meta: SourceMeta;
  records: TenderRecord[];
}

/* ----------------------------------------------------------------------- */
/* Tariffs                                                                    */
/* ----------------------------------------------------------------------- */

export interface TariffTrendPoint {
  period: string;
  fy: string;
  quarter: Quarter;
  /** Discovered tariffs by technology, Rs/kWh. */
  Solar: number;
  FDRE: number;
  Hybrid: number;
  BESS: number;
  RTC: number;
}

export interface TariffContract {
  id: string;
  title: string;
  agency: TenderAgency;
  tech: TenderTech;
  /** Rs/kWh. */
  tariff: number;
  capacityMW: number;
  winner: string;
  date: string;
  period: string;
}

export interface TariffBidderRow {
  player: string;
  tech: TenderTech;
  /** Rs/kWh. */
  tariff: number;
  capacityMW: number;
  project: string;
  period: string;
}

export interface TariffData {
  trend: TariffTrendPoint[];
  contracts: TariffContract[];
  bidders: TariffBidderRow[];
}

/* ----------------------------------------------------------------------- */
/* Capacity commissioning                                                     */
/* ----------------------------------------------------------------------- */

export type PowerSource =
  | "Solar"
  | "Wind"
  | "Hydro"
  | "Thermal"
  | "Nuclear"
  | "BESS";

/** Quarterly capacity commissioned by source, MW. */
export interface CapacityCommissionPoint {
  period: string;
  fy: string;
  quarter: Quarter;
  Solar: number;
  Wind: number;
  Hydro: number;
  Thermal: number;
  Nuclear: number;
  BESS: number;
}

/** Cumulative installed base at quarter end, GW. */
export interface CapacityCumulativePoint {
  period: string;
  fy: string;
  quarter: Quarter;
  totalGW: number;
  renewableGW: number;
}

export interface CapacityData {
  commissioning: CapacityCommissionPoint[];
  cumulative: CapacityCumulativePoint[];
}

/**
 * NPP / CEA monthly "Installed Capacity (in MW) of Power Stations" reading.
 * Each report is an "as on" snapshot — cumulative installed base, not a flow.
 * Multiple readings let us reconstruct the historical series (and derive
 * per-quarter commissioning by differencing).
 */
export interface NppInstalledCapacityPoint {
  /** ISO date — the "as on DD/MM/YYYY" date from the CEA report. */
  asOf: string;
  /** Fiscal-year period this reading maps to, e.g. "Q4 FY26". */
  period: string;
  fy: string;
  quarter: Quarter;
  /** Total installed capacity across all sources, MW. */
  totalMW: number;
  /**
   * Renewable Energy Sources (RES), MW. CEA definition — solar + wind +
   * small hydro + bio + waste-to-energy. Excludes large hydro (which is the
   * separate `Hydro` column in the CEA report).
   */
  renewableMW: number;
}

/** Shape of src/data/live/npp-installed-capacity.json. */
export interface NppInstalledCapacitySnapshot {
  meta: SourceMeta;
  /** Time-ordered list of CEA installed-capacity readings, oldest first. */
  points: NppInstalledCapacityPoint[];
}

/* ----------------------------------------------------------------------- */
/* Power demand                                                               */
/* ----------------------------------------------------------------------- */

export interface DemandMonthlyPoint {
  /** "Apr 21" */
  month: string;
  /** "Apr" */
  monthName: string;
  fy: string;
  quarter: Quarter;
  /** Energy requirement / met, billion units (BU). */
  energyBU: number;
  /** Peak demand met, GW. */
  peakGW: number;
  /** YoY growth of energy requirement, %. */
  yoyPct: number;
}

export interface DemandGrowthPoint {
  /** "FY24" or "Q3 FY25" */
  period: string;
  growthPct: number;
}

export interface DemandData {
  monthly: DemandMonthlyPoint[];
  quarterlyGrowth: DemandGrowthPoint[];
  yearlyGrowth: DemandGrowthPoint[];
}

/* ----------------------------------------------------------------------- */
/* IPP players                                                                */
/* ----------------------------------------------------------------------- */

export interface IppTechSlice {
  tech: string;
  mw: number;
}

export interface IppPlayer {
  id: string;
  name: string;
  /** Operational utility-scale capacity, MW. */
  operationalMW: number;
  /** Capacity under construction, MW. */
  underConstructionMW: number;
  /** Secured pipeline (awarded but not yet under construction), MW. */
  pipelineMW: number;
  /** Cumulative PPA-tied capacity, MW. */
  ppaAwardedMW: number;
  techMix: IppTechSlice[];
  hq: string;
  note?: string;
}

/* ----------------------------------------------------------------------- */
/* Overview cockpit                                                           */
/* ----------------------------------------------------------------------- */

export type AccentTone =
  | "amber"
  | "blue"
  | "emerald"
  | "violet"
  | "orange"
  | "red"
  | "neutral";

export interface KpiStat {
  id: string;
  label: string;
  /** Pre-formatted display value. */
  value: string;
  unit?: string;
  /** Period-over-period change, %. */
  deltaPct?: number;
  deltaLabel?: string;
  /** Sparkline series. */
  trend?: number[];
  tone: AccentTone;
  /** Optional sub-line, e.g. "Q4 FY26 · 20-qtr high". */
  caption?: string;
  /** Provenance of the underlying figure — drives the card's data badge. */
  status: DataStatus;
}

export type InsightTone = "positive" | "negative" | "watch" | "neutral";

export interface InsightItem {
  id: string;
  title: string;
  detail: string;
  tone: InsightTone;
  metric?: string;
}

/* ----------------------------------------------------------------------- */
/* Source registry + health probes                                           */
/* ----------------------------------------------------------------------- */

export type SourceCategory =
  | "Tenders"
  | "Tariffs"
  | "Capacity"
  | "Demand"
  | "DCR"
  | "Manufacturing";

export interface SourceRegistryEntry {
  id: string;
  name: string;
  category: SourceCategory;
  url: string;
  plannedUse: string;
  status: ProbeStatus;
  lastChecked?: string;
  /** HTTP status / latency / error captured by the probe, when run. */
  httpStatus?: number;
  latencyMs?: number;
  errorMessage?: string;
  /** Pages that currently depend on this source. */
  pages: string[];
  /** 1 = ingest first. */
  ingestionPriority: number;
}

/** A single probe result written by scripts/ingest.mjs. */
export interface SourceProbeResult {
  id: string;
  name: string;
  url: string;
  status: ProbeStatus;
  httpStatus?: number;
  latencyMs?: number;
  ok: boolean;
  error?: string;
  checkedAt: string;
}

/** Shape of src/data/live/source-health.json. */
export interface SourceHealthSnapshot {
  meta: SourceMeta;
  generatedAt: string;
  probes: SourceProbeResult[];
}

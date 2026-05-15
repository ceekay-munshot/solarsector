/**
 * Data-provenance helpers. Every card/chart/table in the dashboard renders a
 * badge derived from these definitions so live and mock data are never
 * silently mixed.
 */
import type {
  AccentTone,
  CapacityCumulativePoint,
  CapacityData,
  DataStatus,
  Dataset,
  NppInstalledCapacityPoint,
  NppInstalledCapacitySnapshot,
  ProbeStatus,
  Quarter,
  SeciLiveSnapshot,
  SourceMeta,
  TenderData,
} from "@/lib/types";

export interface StatusConfig {
  /** Full badge label. */
  label: string;
  /** Compact label for tight spaces / filters. */
  short: string;
  tone: AccentTone;
  /** One-line explanation shown in tooltips and the Sources page. */
  description: string;
}

export const DATA_STATUS: Record<DataStatus, StatusConfig> = {
  live: {
    label: "Live",
    short: "Live",
    tone: "emerald",
    description: "Fetched from the upstream source by the latest ingestion run.",
  },
  mock: {
    label: "Mock",
    short: "Mock",
    tone: "violet",
    description:
      "Curated mock dataset. Live ingestion for this feed is not built yet.",
  },
  fallback: {
    label: "Live failed · Mock fallback",
    short: "Fallback",
    tone: "orange",
    description:
      "A live fetch was attempted and failed — showing mock data until the source recovers.",
  },
  pending: {
    label: "Ingestion pending",
    short: "Pending",
    tone: "neutral",
    description: "Ingestion for this source has not been wired up yet.",
  },
};

export const PROBE_STATUS: Record<ProbeStatus, StatusConfig> = {
  live: {
    label: "Reachable",
    short: "Live",
    tone: "emerald",
    description: "Source responded successfully to the latest health probe.",
  },
  fallback: {
    label: "Degraded",
    short: "Degraded",
    tone: "orange",
    description: "Source responded but with an unexpected status — needs review.",
  },
  probe_failed: {
    label: "Probe failed",
    short: "Failed",
    tone: "red",
    description: "Source did not respond to the latest health probe.",
  },
  pending: {
    label: "Not probed",
    short: "Pending",
    tone: "neutral",
    description: "No health probe has run against this source yet.",
  },
};

/** Stable ordering for the global "source status" filter. */
export const DATA_STATUS_ORDER: DataStatus[] = [
  "live",
  "fallback",
  "mock",
  "pending",
];

/**
 * Generic live-or-mock resolver. Given an optional live snapshot and the mock
 * fallback, returns the dataset to render plus an honest provenance badge:
 *  - live snapshot is "live"          → use live data, "Live" badge
 *  - live snapshot is "fallback"/fail → use mock data, "Fallback" badge
 *  - no snapshot / "pending"          → use mock data, "Mock" badge
 */
export function resolveDataset<T>(
  mock: Dataset<T>,
  live?: { meta: SourceMeta; value: T } | null,
): Dataset<T> {
  if (live && live.meta.status === "live") {
    return live;
  }
  if (live && (live.meta.status === "fallback" || live.meta.status === "pending")) {
    const status: DataStatus = live.meta.status === "fallback" ? "fallback" : "mock";
    return {
      meta: {
        status,
        sourceName: mock.meta.sourceName,
        sourceUrl: live.meta.sourceUrl ?? mock.meta.sourceUrl,
        lastChecked: live.meta.lastChecked,
        note:
          status === "fallback"
            ? (live.meta.note ?? "Live fetch failed; showing mock fallback.")
            : mock.meta.note,
      },
      value: mock.value,
    };
  }
  return mock;
}

/**
 * Tender-specific resolver. The SECI live snapshot only carries a tender
 * *records* list; the quarterly/mix/player aggregates stay on mock until a
 * historical-awards parser exists. When SECI is live we swap the records list
 * into the mock aggregates and badge the combined dataset as live.
 */
export function resolveTenderData(
  mock: Dataset<TenderData>,
  snapshot?: SeciLiveSnapshot | null,
): Dataset<TenderData> {
  if (snapshot && snapshot.meta.status === "live" && snapshot.records.length > 0) {
    return {
      meta: snapshot.meta,
      value: { ...mock.value, records: snapshot.records },
    };
  }
  if (snapshot && snapshot.meta.status === "fallback") {
    return {
      meta: {
        status: "fallback",
        sourceName: mock.meta.sourceName,
        sourceUrl: snapshot.meta.sourceUrl ?? mock.meta.sourceUrl,
        lastChecked: snapshot.meta.lastChecked,
        note: snapshot.meta.note ?? "SECI fetch failed; showing mock fallback.",
      },
      value: mock.value,
    };
  }
  return mock;
}

/** Calendar month at the end of each Indian-FY quarter — picks the right NPP reading per quarter. */
const QUARTER_END_MONTH: Record<Quarter, number> = {
  Q1: 6, // Jun
  Q2: 9, // Sep
  Q3: 12, // Dec
  Q4: 3, // Mar
};

/**
 * Capacity-specific resolver. The CEA installed-capacity feed gives a monthly
 * cumulative *stock* — perfect for the cumulative time-series chart. We pick
 * the quarter-end reading for each quarter in the dashboard window and splice
 * it into the mock cumulative series; quarters with no live reading fall back
 * to mock so the chart never has gaps. Per-quarter `commissioning` (the
 * "flow" series, broken down by power source) stays mock here — extracting
 * the per-source breakdown from the CEA report is the next parser change.
 */
export function resolveCapacityData(
  mock: Dataset<CapacityData>,
  snapshot?: NppInstalledCapacitySnapshot | null,
): Dataset<CapacityData> {
  if (!snapshot || snapshot.meta.status !== "live" || snapshot.points.length === 0) {
    return mock;
  }

  // Build period → live point, keyed by quarter-end month.
  const livePoints = new Map<string, NppInstalledCapacityPoint>();
  for (const p of snapshot.points) {
    const monthNum = Number(p.asOf.slice(5, 7));
    if (monthNum === QUARTER_END_MONTH[p.quarter]) {
      livePoints.set(p.period, p);
    }
  }
  if (livePoints.size === 0) return mock;

  let liveCount = 0;
  const cumulative: CapacityCumulativePoint[] = mock.value.cumulative.map((m) => {
    const live = livePoints.get(m.period);
    if (!live) return m;
    liveCount++;
    return {
      period: m.period,
      fy: m.fy,
      quarter: m.quarter,
      totalGW: Math.round((live.totalMW / 1000) * 100) / 100,
      renewableGW: Math.round((live.renewableMW / 1000) * 100) / 100,
    };
  });

  const allLive = liveCount === mock.value.cumulative.length;
  const meta: SourceMeta = allLive
    ? snapshot.meta
    : {
        ...snapshot.meta,
        note: `${liveCount}/${mock.value.cumulative.length} quarters are live; remaining quarters fall back to mock.${
          snapshot.meta.note ? " " + snapshot.meta.note : ""
        }`,
      };

  return {
    meta,
    value: {
      // commissioning stays mock — CEA's installed-capacity report gives stock,
      // not flow, and doesn't break out per-source additions.
      commissioning: mock.value.commissioning,
      cumulative,
    },
  };
}

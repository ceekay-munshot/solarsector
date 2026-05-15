/**
 * Resolved dataset barrel.
 *
 * This is the single place where live snapshots and mock fallbacks are
 * reconciled. Pages import the resolved `Dataset<T>` values from here and
 * never decide live-vs-mock themselves — so every visual badges its data
 * provenance honestly and consistently.
 *
 * Live today: SECI tenders (records only) and the CEA installed-capacity
 * latest point (via NPP). Everything else is mock until its parser is built
 * — see SOLAR_DASHBOARD_PLAN.md.
 */
import nppCapacityRaw from "@/data/live/npp-installed-capacity.json";
import seciRaw from "@/data/live/seci-tenders.json";
import { capacityMock } from "@/data/mock/capacity";
import { dcrMock } from "@/data/mock/dcr";
import { demandMock } from "@/data/mock/demand";
import { ippMock } from "@/data/mock/ipp";
import { tariffMock } from "@/data/mock/tariffs";
import { tenderMock } from "@/data/mock/tenders";
import { resolveTenderData } from "@/lib/dataStatus";
import type {
  NppInstalledCapacitySnapshot,
  SeciLiveSnapshot,
} from "@/lib/types";

const seciSnapshot = seciRaw as unknown as SeciLiveSnapshot;

/** SECI tenders: live records when the latest ingestion run succeeded. */
export const tenderData = resolveTenderData(tenderMock, seciSnapshot);
export const seciSnapshotMeta = seciSnapshot.meta;

/**
 * Provenance for the tender *aggregates* — quarterly awards, technology mix and
 * the developer league. `resolveTenderData` only swaps the live SECI snapshot
 * into the `records` list, so `tenderData.meta` reads "live" while these
 * aggregates are still mock. Visuals driven by the aggregates must badge with
 * this, not `tenderData.meta`, or a live tender book mislabels mock charts.
 */
export const tenderAggregatesMeta = tenderMock.meta;

/**
 * CEA installed-capacity readings via NPP. Today this carries the latest
 * monthly point (Mar-2026); historical readings are added over time as the
 * backfill / monthly Action runs land. Visuals splice the latest live reading
 * onto the mock historical series — see src/app/capacity/page.tsx and
 * src/data/overview.ts. The cumulative time-series chart stays badged from
 * `capacityData.meta` (mock) until the full history is real.
 */
export const capacityLatest =
  nppCapacityRaw as unknown as NppInstalledCapacitySnapshot;

/** Feeds awaiting a live ingestion parser — mock for now, clearly badged. */
export const dcrData = dcrMock;
export const tariffData = tariffMock;
export const capacityData = capacityMock;
export const demandData = demandMock;
export const ippData = ippMock;

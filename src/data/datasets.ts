/**
 * Resolved dataset barrel.
 *
 * This is the single place where live snapshots and mock fallbacks are
 * reconciled. Pages import the resolved `Dataset<T>` values from here and
 * never decide live-vs-mock themselves — so every visual badges its data
 * provenance honestly and consistently.
 *
 * Live today: SECI tenders (records only) and the CEA installed-capacity
 * cumulative series (via NPP — quarter-end readings spliced into the
 * historical chart). Everything else is mock until its parser is built —
 * see SOLAR_DASHBOARD_PLAN.md.
 */
import nppCapacityRaw from "@/data/live/npp-installed-capacity.json";
import seciRaw from "@/data/live/seci-tenders.json";
import { capacityMock } from "@/data/mock/capacity";
import { dcrMock } from "@/data/mock/dcr";
import { demandMock } from "@/data/mock/demand";
import { ippMock } from "@/data/mock/ipp";
import { tariffMock } from "@/data/mock/tariffs";
import { tenderMock } from "@/data/mock/tenders";
import { resolveCapacityData, resolveTenderData } from "@/lib/dataStatus";
import type {
  NppInstalledCapacitySnapshot,
  SeciLiveSnapshot,
} from "@/lib/types";

const seciSnapshot = seciRaw as unknown as SeciLiveSnapshot;
const nppCapacitySnapshot =
  nppCapacityRaw as unknown as NppInstalledCapacitySnapshot;

/** SECI tenders: live records when the latest ingestion run succeeded. */
export const tenderData = resolveTenderData(tenderMock, seciSnapshot);
export const seciSnapshotMeta = seciSnapshot.meta;

/**
 * Provenance for the tender *award + mix aggregates* (quarterly awards and the
 * tech-mix chart). Lights up live only once the SECI snapshot carries
 * `aggregates` — until the parser change lands and CI re-populates the
 * snapshot, this stays on the mock meta so the visuals honestly badge Mock.
 * The developer-league table has its own meta below — players are still
 * mock since the parser doesn't extract winners yet.
 */
export const tenderAggregatesMeta =
  seciSnapshot.meta.status === "live" && seciSnapshot.aggregates
    ? seciSnapshot.meta
    : tenderMock.meta;

/**
 * Developer-league (players) provenance — stays on mock until the parser is
 * extended to extract winner names from SECI's results page. The Tenders
 * page's "Awards by developer" table badges from this so an otherwise-live
 * snapshot doesn't leak its badge onto the still-synthetic player roster.
 */
export const tenderPlayersMeta = tenderMock.meta;

/**
 * CEA installed-capacity readings via NPP. The committed snapshot grows by
 * one monthly point per ingestion run; the resolver picks each quarter-end
 * reading and splices it into the cumulative time-series and (when per-source
 * `bySource` data is present) derives per-quarter commissioning by
 * differencing consecutive quarter-end stocks.
 */
export const capacityData = resolveCapacityData(capacityMock, nppCapacitySnapshot);

/**
 * Provenance specifically for the per-source commissioning visuals. Lights up
 * "live" only once the snapshot carries `bySource` per-source breakdowns —
 * during the gap between merging the per-source parser change and the next
 * ingestion run that re-populates the snapshot, this stays on the mock meta
 * so the commissioning chart honestly badges Mock until real data lands.
 * BESS is omitted from the per-source chart on the Capacity page since CEA's
 * installed-capacity report doesn't track battery storage.
 */
export const capacityCommissioningMeta =
  nppCapacitySnapshot.meta.status === "live" &&
  nppCapacitySnapshot.points.some((p) => p.bySource != null)
    ? capacityData.meta
    : capacityMock.meta;

/** Feeds awaiting a live ingestion parser — mock for now, clearly badged. */
export const dcrData = dcrMock;
export const tariffData = tariffMock;
export const demandData = demandMock;
export const ippData = ippMock;

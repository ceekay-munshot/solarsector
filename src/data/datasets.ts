/**
 * Resolved dataset barrel.
 *
 * This is the single place where live snapshots and mock fallbacks are
 * reconciled. Pages import the resolved `Dataset<T>` values from here and
 * never decide live-vs-mock themselves — so every visual badges its data
 * provenance honestly and consistently.
 *
 * Today only SECI tenders attempt a live fetch; every other feed is mock
 * until its ingestion parser is built (see SOLAR_DASHBOARD_PLAN.md).
 */
import seciRaw from "@/data/live/seci-tenders.json";
import { capacityMock } from "@/data/mock/capacity";
import { dcrMock } from "@/data/mock/dcr";
import { demandMock } from "@/data/mock/demand";
import { ippMock } from "@/data/mock/ipp";
import { tariffMock } from "@/data/mock/tariffs";
import { tenderMock } from "@/data/mock/tenders";
import { resolveTenderData } from "@/lib/dataStatus";
import type { SeciLiveSnapshot } from "@/lib/types";

const seciSnapshot = seciRaw as unknown as SeciLiveSnapshot;

/** SECI tenders: live records when the latest ingestion run succeeded. */
export const tenderData = resolveTenderData(tenderMock, seciSnapshot);
export const seciSnapshotMeta = seciSnapshot.meta;

/** Feeds awaiting a live ingestion parser — mock for now, clearly badged. */
export const dcrData = dcrMock;
export const tariffData = tariffMock;
export const capacityData = capacityMock;
export const demandData = demandMock;
export const ippData = ippMock;

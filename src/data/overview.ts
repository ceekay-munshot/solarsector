/**
 * Overview cockpit — derived KPI strip + editorial "what changed" insights.
 *
 * KPIs are computed from the *resolved* datasets, so each card carries the
 * provenance of the feed it draws from (mostly mock today; the live-tender
 * card reflects the SECI snapshot). Insights are editorial mock commentary,
 * but their headline numbers are computed from the same data so they never
 * drift from the charts.
 */
import {
  capacityData,
  capacityLatest,
  dcrData,
  demandData,
  ippData,
  tariffData,
  tenderAggregatesMeta,
  tenderData,
} from "@/data/datasets";
import { LATEST_FY, LATEST_PERIOD } from "@/data/periods";
import {
  formatCapacity,
  formatGW,
  formatMW,
  formatNumber,
  formatTariff,
} from "@/lib/format";
import { pctChange } from "@/lib/seededRandom";
import type { DataStatus, Dataset, InsightItem, KpiStat } from "@/lib/types";

const dcr = dcrData.value;
const tenders = tenderData.value;
const tariffs = tariffData.value;
const capacity = capacityData.value;
const demand = demandData.value;
const ipp = ippData.value;

const last = <T>(arr: T[]): T => arr[arr.length - 1];
const prev = <T>(arr: T[]): T => arr[arr.length - 2];

const dcrLatest = last(dcr.quarterly);
const dcrPrev = prev(dcr.quarterly);
const awardLatest = last(tenders.quarterlyAwards);
const awardPrev = prev(tenders.quarterlyAwards);
const tariffLatest = last(tariffs.trend);
const tariffPrev = prev(tariffs.trend);
const capLatest = last(capacity.cumulative);
const capPrev = prev(capacity.cumulative);

const latestFyMonths = demand.monthly.filter((m) => m.fy === LATEST_FY);
const priorFyMonths = demand.monthly.filter(
  (m) => m.fy === `FY${Number(LATEST_FY.slice(2)) - 1}`,
);
const annualPeak = Math.max(...latestFyMonths.map((m) => m.peakGW));
const priorAnnualPeak = Math.max(...priorFyMonths.map((m) => m.peakGW));

const tenderBookMW = tenders.records.reduce((acc, r) => acc + r.capacityMW, 0);
const ippPipelineMW = ipp.reduce((acc, p) => acc + p.pipelineMW, 0);
const moduleCellGap = dcrLatest.moduleMW - dcrLatest.cellMW;

// Live CEA installed-capacity reading via NPP, when available. The latest
// point drives the RE-base KPI; the sparkline stays on mock history until
// backfill lands.
const liveCapacityPoint =
  capacityLatest.meta.status === "live" && capacityLatest.points.length > 0
    ? capacityLatest.points[capacityLatest.points.length - 1]
    : null;
const reBaseGW = liveCapacityPoint
  ? liveCapacityPoint.renewableMW / 1000
  : capLatest.renewableGW;
const reBaseStatus: DataStatus = liveCapacityPoint
  ? capacityLatest.meta.status
  : capacityData.meta.status;
const reBasePeriod = liveCapacityPoint?.period ?? LATEST_PERIOD;

export const overviewKpis: KpiStat[] = [
  {
    id: "dcr-module",
    label: "DCR Module Output",
    value: formatMW(dcrLatest.moduleMW),
    deltaPct: pctChange(dcrLatest.moduleMW, dcrPrev.moduleMW),
    deltaLabel: "QoQ",
    trend: dcr.quarterly.slice(-8).map((q) => q.moduleMW),
    tone: "amber",
    caption: `${LATEST_PERIOD} · per quarter`,
    status: dcrData.meta.status,
  },
  {
    id: "dcr-cell",
    label: "DCR Cell Output",
    value: formatMW(dcrLatest.cellMW),
    deltaPct: pctChange(dcrLatest.cellMW, dcrPrev.cellMW),
    deltaLabel: "QoQ",
    trend: dcr.quarterly.slice(-8).map((q) => q.cellMW),
    tone: "emerald",
    caption: `${LATEST_PERIOD} · per quarter`,
    status: dcrData.meta.status,
  },
  {
    id: "tenders-awarded",
    label: "Tenders Awarded",
    value: formatCapacity(awardLatest.awardedMW),
    deltaPct: pctChange(awardLatest.awardedMW, awardPrev.awardedMW),
    deltaLabel: "QoQ",
    trend: tenders.quarterlyAwards.slice(-8).map((q) => q.awardedMW),
    tone: "blue",
    caption: `${LATEST_PERIOD} · all technologies`,
    status: tenderAggregatesMeta.status,
  },
  {
    id: "tender-book",
    label: "Live Tender Book",
    value: `${formatNumber(tenders.records.length)} tenders`,
    trend: tenders.quarterlyAwards.slice(-8).map((q) => q.awardedMW),
    tone: "violet",
    caption: `${formatCapacity(tenderBookMW)} tracked · ${
      tenderData.meta.status === "live" ? "SECI live" : "SECI mock fallback"
    }`,
    status: tenderData.meta.status,
  },
  {
    id: "solar-tariff",
    label: "Avg Solar Tariff",
    value: formatTariff(tariffLatest.Solar),
    unit: "/kWh",
    deltaPct: pctChange(tariffLatest.Solar, tariffPrev.Solar),
    deltaLabel: "QoQ",
    trend: tariffs.trend.slice(-8).map((t) => t.Solar),
    tone: "amber",
    caption: `${LATEST_PERIOD} · discovered tariff`,
    status: tariffData.meta.status,
  },
  {
    id: "re-base",
    label: "RE Installed Base",
    value: formatGW(reBaseGW, 0),
    deltaPct: liveCapacityPoint
      ? undefined
      : pctChange(capLatest.renewableGW, capPrev.renewableGW),
    deltaLabel: "QoQ",
    trend: capacity.cumulative.slice(-8).map((c) => c.renewableGW),
    tone: "emerald",
    caption: `${reBasePeriod} · cumulative`,
    status: reBaseStatus,
  },
  {
    id: "peak-demand",
    label: "Peak Demand",
    value: formatGW(annualPeak, 0),
    deltaPct: pctChange(annualPeak, priorAnnualPeak),
    deltaLabel: "vs prior FY",
    trend: demand.monthly.slice(-12).map((m) => m.peakGW),
    tone: "orange",
    caption: `${LATEST_FY} peak · all-India`,
    status: demandData.meta.status,
  },
  {
    id: "ipp-pipeline",
    label: "IPP Secured Pipeline",
    value: formatCapacity(ippPipelineMW),
    trend: ipp
      .slice()
      .sort((a, b) => b.pipelineMW - a.pipelineMW)
      .map((p) => p.pipelineMW),
    tone: "violet",
    caption: `${ipp.length} tracked platforms`,
    status: ippData.meta.status,
  },
];

export const overviewInsights: Dataset<InsightItem[]> = {
  meta: {
    status: "mock",
    sourceName: "Editorial — research desk commentary",
    note: "Editorial commentary. Headline figures are computed from the dashboard datasets so they track the charts.",
  },
  value: [
    {
      id: "i1",
      title: "DCR cell output hit a fresh high",
      detail: `Cell production reached ${formatMW(
        dcrLatest.cellMW,
      )} in ${LATEST_PERIOD} — the strongest quarter on record as new integrated lines ramped.`,
      tone: "positive",
      metric: formatMW(dcrLatest.cellMW),
    },
    {
      id: "i2",
      title: "Module–cell gap still open",
      detail: `Module output runs ${formatMW(
        moduleCellGap,
      )}/quarter ahead of cell output. India's cell base is closing the gap but is not there yet.`,
      tone: "watch",
      metric: `${formatMW(moduleCellGap)} gap`,
    },
    {
      id: "i3",
      title: "FDRE is now a top-tier tender category",
      detail: `Firm & dispatchable RE awards reached ${formatCapacity(
        last(tenders.mix).FDRE,
      )} this quarter, trailing only plain solar in the technology mix.`,
      tone: "positive",
      metric: formatCapacity(last(tenders.mix).FDRE),
    },
    {
      id: "i4",
      title: "Award volume set a 20-quarter high",
      detail: `Total awarded capacity hit ${formatCapacity(
        awardLatest.awardedMW,
      )} in ${LATEST_PERIOD} — the heaviest quarter in the 5-year window on the fiscal year-end push.`,
      tone: "positive",
      metric: formatCapacity(awardLatest.awardedMW),
    },
    {
      id: "i5",
      title: "Solar tariffs firmed again",
      detail: `Discovered solar tariff rose to ${formatTariff(
        tariffLatest.Solar,
      )}/kWh on cell-cost pass-through, well off the FY23 lows.`,
      tone: "watch",
      metric: `${formatTariff(tariffLatest.Solar)}/kWh`,
    },
    {
      id: "i6",
      title: "BESS economics inflected",
      detail: `Standalone BESS tariffs fell to ${formatTariff(
        tariffLatest.BESS,
      )}/kWh-equivalent, unlocking the firm-power and RTC contracting stack.`,
      tone: "positive",
      metric: `${formatTariff(tariffLatest.BESS)}/kWh`,
    },
  ],
};

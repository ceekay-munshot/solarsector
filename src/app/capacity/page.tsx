"use client";

import { Activity, Layers, Sun, Zap } from "lucide-react";
import { ChartCard } from "@/components/cards/ChartCard";
import { SourceHealthCard } from "@/components/cards/SourceHealthCard";
import { StatTile } from "@/components/cards/StatTile";
import { DonutChart } from "@/components/charts/DonutChart";
import { MixChart } from "@/components/charts/MixChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { useFilters } from "@/components/filters/FilterContext";
import { GlobalFilters } from "@/components/filters/GlobalFilters";
import { PageHeader } from "@/components/primitives/PageHeader";
import { SectionTitle } from "@/components/primitives/SectionTitle";
import { capacityData, capacityLatest } from "@/data/datasets";
import { LATEST_PERIOD } from "@/data/periods";
import { sourceRegistry } from "@/data/sources";
import { SOURCE_COLORS, chartRows } from "@/lib/chartTheme";
import { filterByPeriod } from "@/lib/filterData";
import { formatGW, formatMW, formatPct } from "@/lib/format";
import { pctChange } from "@/lib/seededRandom";
import type { DataStatus, PowerSource } from "@/lib/types";

const capacity = capacityData.value;
const sources: PowerSource[] = [
  "Solar",
  "Wind",
  "Hydro",
  "Thermal",
  "Nuclear",
  "BESS",
];
const sourceSeries = sources.map((s) => ({
  key: s,
  label: s,
  color: SOURCE_COLORS[s],
}));
const nppSource = sourceRegistry.find((s) => s.id === "npp-reports");

const totalOf = (p: (typeof capacity.commissioning)[number]) =>
  sources.reduce((acc, s) => acc + p[s], 0);

export default function CapacityPage() {
  const f = useFilters();

  const commissioning = filterByPeriod(capacity.commissioning, f);
  const cumulative = filterByPeriod(capacity.cumulative, f);

  const latestComm = capacity.commissioning[capacity.commissioning.length - 1];
  const prevComm = capacity.commissioning[capacity.commissioning.length - 2];
  const latestCumulative = capacity.cumulative[capacity.cumulative.length - 1];
  const prevCumulative = capacity.cumulative[capacity.cumulative.length - 2];

  // CEA installed-capacity is "stock" data — one snapshot gives the latest
  // cumulative reading, no per-quarter "flow." We splice the live reading
  // onto the headline KPIs; the time-series chart stays on mock history
  // until backfill lands, and `commissioning` stays mock either way.
  const liveLatest =
    capacityLatest.meta.status === "live" && capacityLatest.points.length > 0
      ? capacityLatest.points[capacityLatest.points.length - 1]
      : null;
  const headlineStatus: DataStatus = liveLatest
    ? capacityLatest.meta.status
    : "mock";
  const headlineTotalGW = liveLatest
    ? liveLatest.totalMW / 1000
    : latestCumulative.totalGW;
  const headlineRenewableGW = liveLatest
    ? liveLatest.renewableMW / 1000
    : latestCumulative.renewableGW;
  const headlinePeriod = liveLatest?.period ?? LATEST_PERIOD;

  const reShare = (headlineRenewableGW / headlineTotalGW) * 100;
  const prevReShare =
    (prevCumulative.renewableGW / prevCumulative.totalGW) * 100;

  const activeSeries =
    f.tech === "all"
      ? sourceSeries
      : sourceSeries.filter((s) => s.key === f.tech);

  const donutData = sources.map((s) => ({
    name: s,
    value: latestComm[s],
    color: SOURCE_COLORS[s],
  }));

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Generation Build-out"
        title="Capacity — Commissioning by Source"
        description="Quarterly capacity commissioning across solar, wind, hydro, thermal, nuclear and BESS, plus the cumulative installed base. The latest installed-capacity reading comes live from CEA monthly reports (via NPP); the historical series and per-quarter commissioning stay mock until backfill lands."
        datasets={[
          { label: "Latest installed capacity", meta: capacityLatest.meta },
          { label: "Capacity history", meta: capacityData.meta },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">Filter</span>
        <GlobalFilters
          techOptions={sources.map((s) => ({ value: s, label: s }))}
          techLabel="Source"
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Commissioned this quarter"
          value={formatMW(totalOf(latestComm))}
          caption={`${LATEST_PERIOD} · all sources`}
          delta={pctChange(totalOf(latestComm), totalOf(prevComm))}
          deltaLabel="QoQ"
          tone="amber"
          status="mock"
          icon={Zap}
        />
        <StatTile
          label="Total installed base"
          value={formatGW(headlineTotalGW, 0)}
          caption={`${headlinePeriod} · cumulative`}
          delta={
            liveLatest
              ? undefined
              : pctChange(latestCumulative.totalGW, prevCumulative.totalGW)
          }
          deltaLabel="QoQ"
          tone="blue"
          status={headlineStatus}
          icon={Layers}
        />
        <StatTile
          label="RE installed base"
          value={formatGW(headlineRenewableGW, 0)}
          caption={`${headlinePeriod} · cumulative`}
          delta={
            liveLatest
              ? undefined
              : pctChange(
                  latestCumulative.renewableGW,
                  prevCumulative.renewableGW,
                )
          }
          deltaLabel="QoQ"
          tone="emerald"
          status={headlineStatus}
          icon={Sun}
        />
        <StatTile
          label="RE share of total"
          value={formatPct(reShare)}
          caption={`${headlinePeriod} · renewable mix`}
          delta={liveLatest ? undefined : pctChange(reShare, prevReShare)}
          deltaLabel="QoQ"
          tone="violet"
          status={headlineStatus}
          icon={Activity}
        />
      </section>

      <section>
        <SectionTitle
          eyebrow="Commissioning"
          title="Quarterly commissioning by power source"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="Capacity commissioned by source"
            subtitle="MW commissioned per quarter — solar, wind, hydro, thermal, nuclear, BESS"
            meta={capacityData.meta}
            legend={activeSeries.map((s) => ({
              label: s.label,
              color: s.color,
            }))}
          >
            <MixChart
              data={chartRows(commissioning)}
              xKey="period"
              series={activeSeries}
              height={280}
              yFormatter={(n) => `${Math.round(n / 1000)}GW`}
              valueFormatter={(n) => formatMW(n)}
            />
          </ChartCard>
          <ChartCard
            title="Source mix — latest quarter"
            subtitle={`Commissioning split · ${LATEST_PERIOD}`}
            meta={capacityData.meta}
            legend={sourceSeries.map((s) => ({
              label: s.label,
              color: s.color,
            }))}
          >
            <DonutChart
              data={donutData}
              height={250}
              centerValue={formatMW(totalOf(latestComm))}
              centerLabel="commissioned"
              valueFormatter={(n) => formatMW(n)}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <ChartCard
          title="Cumulative installed capacity"
          subtitle="Quarter-end installed base — total vs renewable, GW"
          meta={capacityData.meta}
          legend={[
            { label: "Total installed", color: SOURCE_COLORS.Thermal },
            { label: "RE installed", color: SOURCE_COLORS.Solar },
          ]}
        >
          <TrendChart
            data={chartRows(cumulative)}
            xKey="period"
            area
            height={280}
            series={[
              {
                key: "totalGW",
                label: "Total installed",
                color: SOURCE_COLORS.Thermal,
              },
              {
                key: "renewableGW",
                label: "RE installed",
                color: SOURCE_COLORS.Solar,
              },
            ]}
            yFormatter={(n) => `${n} GW`}
            valueFormatter={(n) => formatGW(n, 0)}
          />
        </ChartCard>
      </section>

      {nppSource && (
        <section>
          <SectionTitle
            eyebrow="Source health"
            title="Live capacity source — NPP"
            description="NPP published reports power the live installed-capacity readings — probe health and last-checked time below."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SourceHealthCard entry={nppSource} />
          </div>
        </section>
      )}
    </div>
  );
}

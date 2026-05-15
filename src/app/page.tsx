"use client";

import { DataBadge } from "@/components/badges/DataBadge";
import { ChartCard } from "@/components/cards/ChartCard";
import { InsightCard } from "@/components/cards/InsightCard";
import { KpiCard } from "@/components/cards/KpiCard";
import { BarSeriesChart } from "@/components/charts/BarSeriesChart";
import { MixChart } from "@/components/charts/MixChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { useFilters } from "@/components/filters/FilterContext";
import { GlobalFilters } from "@/components/filters/GlobalFilters";
import { PageHeader } from "@/components/primitives/PageHeader";
import { SectionTitle } from "@/components/primitives/SectionTitle";
import { RankingTable } from "@/components/tables/RankingTable";
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
import { overviewInsights, overviewKpis } from "@/data/overview";
import { fyOf } from "@/data/periods";
import { CHART, TECH_COLORS, chartRows } from "@/lib/chartTheme";
import { filterByPeriod } from "@/lib/filterData";
import {
  formatCapacity,
  formatGW,
  formatMW,
  formatPct,
  formatTariff,
} from "@/lib/format";

const techSeries = (
  ["Solar", "FDRE", "Wind", "BESS", "Hybrid", "RTC"] as const
).map((k) => ({ key: k, label: k, color: TECH_COLORS[k] }));
const tariffSeries = (
  ["Solar", "FDRE", "Hybrid", "BESS", "RTC"] as const
).map((k) => ({ key: k, label: k, color: TECH_COLORS[k] }));

export default function OverviewPage() {
  const f = useFilters();

  const capacityTrend = filterByPeriod(capacityData.value.cumulative, f);
  const awardTrend = filterByPeriod(tenderData.value.quarterlyAwards, f);
  const tenderMix = filterByPeriod(tenderData.value.mix, f);
  const tariffTrend = filterByPeriod(tariffData.value.trend, f);
  const demandGrowth = demandData.value.quarterlyGrowth.filter(
    (r) =>
      (f.fy === "all" || fyOf(r.period) === f.fy) &&
      (f.quarter === "all" || r.period.startsWith(f.quarter)),
  );
  const ippLeaders = [...ippData.value]
    .sort((a, b) => b.pipelineMW - a.pipelineMW)
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.name,
      value: p.pipelineMW,
      displayValue: formatCapacity(p.pipelineMW),
      secondary: `${formatCapacity(p.operationalMW)} live`,
      color: CHART.violet,
    }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Executive Cockpit"
        title="India Solar & Power — Command Center"
        description="A boardroom view of India's solar and power sector — DCR manufacturing, tenders, tariffs, capacity, demand and IPP pipelines. A mixed-data prototype: live where sources are reachable, clearly-badged mock where ingestion is still being built."
        datasets={[
          { label: "Tender book", meta: tenderData.meta },
          { label: "Tender aggregates", meta: tenderAggregatesMeta },
          { label: "DCR", meta: dcrData.meta },
          { label: "Tariffs", meta: tariffData.meta },
          { label: "Capacity (latest)", meta: capacityLatest.meta },
          { label: "Capacity history", meta: capacityData.meta },
          { label: "Demand", meta: demandData.meta },
          { label: "IPP", meta: ippData.meta },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">Filter</span>
        <GlobalFilters />
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {overviewKpis.map((stat) => (
          <KpiCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section>
        <SectionTitle
          eyebrow="Quarter in review"
          title="What changed this quarter"
          action={<DataBadge status={overviewInsights.meta.status} size="sm" />}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {overviewInsights.value.map((item) => (
            <InsightCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Capacity & tenders"
          title="Build-out and award momentum"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Installed capacity — RE vs total"
            subtitle="Cumulative installed base, quarter-end"
            meta={capacityData.meta}
            legend={[
              { label: "RE installed", color: CHART.emerald },
              { label: "Total installed", color: CHART.blue },
            ]}
          >
            <TrendChart
              data={chartRows(capacityTrend)}
              xKey="period"
              area
              height={260}
              series={[
                {
                  key: "renewableGW",
                  label: "RE installed",
                  color: CHART.emerald,
                },
                { key: "totalGW", label: "Total installed", color: CHART.blue },
              ]}
              yFormatter={(n) => `${n} GW`}
              valueFormatter={(n) => formatGW(n, 0)}
            />
          </ChartCard>
          <ChartCard
            title="Tenders awarded — quarterly"
            subtitle="All technologies, capacity awarded per quarter"
            meta={tenderAggregatesMeta}
            legend={[{ label: "Awarded capacity", color: CHART.amber }]}
          >
            <TrendChart
              data={chartRows(awardTrend)}
              xKey="period"
              area
              height={260}
              series={[
                {
                  key: "awardedMW",
                  label: "Awarded capacity",
                  color: CHART.amber,
                },
              ]}
              yFormatter={(n) => `${Math.round(n / 1000)}GW`}
              valueFormatter={(n) => formatMW(n)}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Tender mix by technology"
            subtitle="Quarterly awarded capacity — solar, FDRE, wind, BESS, hybrid, RTC"
            meta={tenderAggregatesMeta}
            legend={techSeries.map((s) => ({ label: s.label, color: s.color }))}
          >
            <MixChart
              data={chartRows(tenderMix)}
              xKey="period"
              series={techSeries}
              height={260}
              yFormatter={(n) => `${Math.round(n / 1000)}GW`}
              valueFormatter={(n) => formatMW(n)}
            />
          </ChartCard>
          <ChartCard
            title="Discovered tariff trend"
            subtitle="Rs/kWh by technology"
            meta={tariffData.meta}
            legend={tariffSeries.map((s) => ({ label: s.label, color: s.color }))}
          >
            <TrendChart
              data={chartRows(tariffTrend)}
              xKey="period"
              height={260}
              series={tariffSeries}
              yFormatter={(n) => `₹${n}`}
              valueFormatter={(n) => `${formatTariff(n)}/kWh`}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Demand & developers"
          title="Power demand and the developer pipeline"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="Power demand growth — quarterly YoY"
            subtitle="All-India energy requirement, % change vs the prior-year quarter"
            meta={demandData.meta}
          >
            {demandGrowth.length > 0 ? (
              <BarSeriesChart
                data={chartRows(demandGrowth)}
                xKey="period"
                height={260}
                series={[
                  { key: "growthPct", label: "YoY growth", color: CHART.blue },
                ]}
                yFormatter={(n) => `${n}%`}
                valueFormatter={(n) => formatPct(n)}
                signColors
                zeroLine
              />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-center text-sm text-faint">
                No demand-growth data for the selected filters — FY22 is the
                baseline year.
              </div>
            )}
          </ChartCard>
          <ChartCard
            title="Top IPP pipelines"
            subtitle="Secured pipeline capacity by developer"
            meta={ippData.meta}
          >
            <div className="py-1">
              <RankingTable rows={ippLeaders} />
            </div>
          </ChartCard>
        </div>
      </section>
    </div>
  );
}

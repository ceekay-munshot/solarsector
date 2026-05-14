"use client";

import { Activity, Flame, Gauge, Zap } from "lucide-react";
import { ChartCard } from "@/components/cards/ChartCard";
import { StatTile } from "@/components/cards/StatTile";
import { BarSeriesChart } from "@/components/charts/BarSeriesChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { useFilters } from "@/components/filters/FilterContext";
import { GlobalFilters } from "@/components/filters/GlobalFilters";
import { PageHeader } from "@/components/primitives/PageHeader";
import { SectionTitle } from "@/components/primitives/SectionTitle";
import { demandData } from "@/data/datasets";
import { LATEST_FY, fyOf } from "@/data/periods";
import { CHART, chartRows } from "@/lib/chartTheme";
import { filterByPeriod } from "@/lib/filterData";
import { formatBU, formatGW, formatPct } from "@/lib/format";
import { pctChange, roundTo } from "@/lib/seededRandom";

const demand = demandData.value;
const FY_MONTH_ORDER = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

export default function DemandPage() {
  const f = useFilters();

  const monthly = filterByPeriod(demand.monthly, f);
  const quarterlyGrowth = demand.quarterlyGrowth.filter(
    (r) =>
      (f.fy === "all" || fyOf(r.period) === f.fy) &&
      (f.quarter === "all" || r.period.startsWith(f.quarter)),
  );
  const yearlyGrowth = demand.yearlyGrowth.filter(
    (r) => f.fy === "all" || r.period === f.fy,
  );

  const seasonalitySource =
    f.fy === "all"
      ? demand.monthly
      : demand.monthly.filter((m) => m.fy === f.fy);
  const seasonality = FY_MONTH_ORDER.map((monthName) => {
    const vals = seasonalitySource
      .filter((m) => m.monthName === monthName)
      .map((m) => m.energyBU);
    return {
      monthName,
      energyBU: vals.length
        ? roundTo(vals.reduce((a, b) => a + b, 0) / vals.length, 0.1)
        : 0,
    };
  });

  const latest = demand.monthly[demand.monthly.length - 1];
  const prev = demand.monthly[demand.monthly.length - 2];
  const latestFyMonths = demand.monthly.filter((m) => m.fy === LATEST_FY);
  const fyPeak = Math.max(...latestFyMonths.map((m) => m.peakGW));

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Power Demand"
        title="Demand — Growth & Seasonality"
        description="All-India power demand: monthly energy requirement and peak demand, quarterly and yearly growth, and the summer-peak seasonality pattern. Synthetic 5-year series until a live POSOCO / CEA / NPP parser is built."
        datasets={[{ label: "Power demand", meta: demandData.meta }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">Filter</span>
        <GlobalFilters />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Peak demand"
          value={formatGW(latest.peakGW, 0)}
          caption={`${latest.month} · all-India`}
          delta={pctChange(latest.peakGW, prev.peakGW)}
          deltaLabel="MoM"
          tone="orange"
          status="mock"
          icon={Flame}
        />
        <StatTile
          label="Energy requirement"
          value={formatBU(latest.energyBU)}
          caption={`${latest.month} · energy met`}
          delta={pctChange(latest.energyBU, prev.energyBU)}
          deltaLabel="MoM"
          tone="amber"
          status="mock"
          icon={Zap}
        />
        <StatTile
          label="YoY demand growth"
          value={formatPct(latest.yoyPct)}
          caption={`${latest.month} · vs prior year`}
          tone="emerald"
          status="mock"
          icon={Activity}
        />
        <StatTile
          label={`${LATEST_FY} peak`}
          value={formatGW(fyPeak, 0)}
          caption="Highest monthly peak this FY"
          tone="blue"
          status="mock"
          icon={Gauge}
        />
      </section>

      <section>
        <SectionTitle
          eyebrow="Monthly trends"
          title="Energy requirement & peak demand"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Monthly energy requirement"
            subtitle="All-India energy met, billion units (BU)"
            meta={demandData.meta}
            legend={[{ label: "Energy requirement", color: CHART.amber }]}
          >
            <TrendChart
              data={chartRows(monthly)}
              xKey="month"
              area
              height={260}
              series={[
                {
                  key: "energyBU",
                  label: "Energy requirement",
                  color: CHART.amber,
                },
              ]}
              yFormatter={(n) => `${n}`}
              valueFormatter={(n) => formatBU(n)}
            />
          </ChartCard>
          <ChartCard
            title="Monthly peak demand"
            subtitle="All-India peak demand met, GW"
            meta={demandData.meta}
            legend={[{ label: "Peak demand", color: CHART.orange }]}
          >
            <TrendChart
              data={chartRows(monthly)}
              xKey="month"
              area
              height={260}
              series={[
                { key: "peakGW", label: "Peak demand", color: CHART.orange },
              ]}
              yFormatter={(n) => `${n} GW`}
              valueFormatter={(n) => formatGW(n, 0)}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Growth"
          title="Quarterly & yearly demand growth"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="Quarterly demand growth"
            subtitle="YoY % change in energy requirement, vs prior-year quarter"
            meta={demandData.meta}
          >
            {quarterlyGrowth.length > 0 ? (
              <BarSeriesChart
                data={chartRows(quarterlyGrowth)}
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
                No quarterly-growth data for these filters — FY22 is the
                baseline year.
              </div>
            )}
          </ChartCard>
          <ChartCard
            title="Yearly demand growth"
            subtitle="YoY % change in annual energy requirement"
            meta={demandData.meta}
          >
            {yearlyGrowth.length > 0 ? (
              <BarSeriesChart
                data={chartRows(yearlyGrowth)}
                xKey="period"
                height={260}
                series={[
                  { key: "growthPct", label: "YoY growth", color: CHART.emerald },
                ]}
                yFormatter={(n) => `${n}%`}
                valueFormatter={(n) => formatPct(n)}
                signColors
                zeroLine
              />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-center text-sm text-faint">
                FY22 is the baseline year — no prior-year comparison.
              </div>
            )}
          </ChartCard>
        </div>
      </section>

      <section>
        <ChartCard
          title="Demand seasonality"
          subtitle={
            f.fy === "all"
              ? "Average monthly energy requirement across FY22–FY26 — the summer-peak pattern"
              : `Monthly energy requirement · ${f.fy}`
          }
          meta={demandData.meta}
        >
          <BarSeriesChart
            data={chartRows(seasonality)}
            xKey="monthName"
            height={250}
            series={[
              { key: "energyBU", label: "Energy requirement", color: CHART.violet },
            ]}
            yFormatter={(n) => `${n}`}
            valueFormatter={(n) => formatBU(n)}
          />
        </ChartCard>
      </section>
    </div>
  );
}

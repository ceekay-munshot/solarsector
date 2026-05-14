"use client";

import { IndianRupee, TrendingDown, Wallet, Zap } from "lucide-react";
import { ChartCard } from "@/components/cards/ChartCard";
import { SourceHealthCard } from "@/components/cards/SourceHealthCard";
import { StatTile } from "@/components/cards/StatTile";
import { BarSeriesChart } from "@/components/charts/BarSeriesChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { useFilters } from "@/components/filters/FilterContext";
import { GlobalFilters } from "@/components/filters/GlobalFilters";
import { EmptyState } from "@/components/primitives/EmptyState";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Panel } from "@/components/primitives/Panel";
import { SectionTitle } from "@/components/primitives/SectionTitle";
import { Tag } from "@/components/primitives/Tag";
import { DataTable } from "@/components/tables/DataTable";
import { tariffData } from "@/data/datasets";
import { LATEST_PERIOD, fyOf } from "@/data/periods";
import { sourceRegistry } from "@/data/sources";
import { CHART, TECH_COLORS, chartRows } from "@/lib/chartTheme";
import { filterByPeriod, matches } from "@/lib/filterData";
import { formatMW, formatTariff } from "@/lib/format";
import { pctChange } from "@/lib/seededRandom";
import type { TariffBidderRow } from "@/lib/types";

const tariffs = tariffData.value;
const techKeys = ["Solar", "FDRE", "Hybrid", "BESS", "RTC"] as const;
const cercSource = sourceRegistry.find((s) => s.id === "cerc-orders");

export default function TariffsPage() {
  const f = useFilters();

  const trend = filterByPeriod(tariffs.trend, f);
  const lastTrend = tariffs.trend[tariffs.trend.length - 1];
  const prevTrend = tariffs.trend[tariffs.trend.length - 2];

  // Tech filter narrows the headline trend to a single technology.
  const trendSeries = (
    f.tech === "all"
      ? techKeys
      : techKeys.filter((k) => k === f.tech)
  ).map((k) => ({ key: k, label: k, color: TECH_COLORS[k] }));

  const comparisonSeries = (["Solar", "FDRE", "Hybrid", "BESS"] as const).map(
    (k) => ({ key: k, label: k, color: TECH_COLORS[k] }),
  );

  const latestByTech = techKeys.map((k) => ({
    tech: k,
    tariff: lastTrend[k],
  }));

  const contracts = tariffs.contracts.filter((c) => matches(c.tech, f.tech));
  const bidders = tariffs.bidders.filter(
    (b) =>
      matches(b.tech, f.tech) &&
      (f.fy === "all" || fyOf(b.period) === f.fy) &&
      (f.quarter === "all" || b.period.startsWith(f.quarter)),
  );

  const bidderColumns = [
    {
      key: "player",
      header: "Bidder",
      render: (r: TariffBidderRow) => (
        <span className="font-medium text-ink">{r.player}</span>
      ),
    },
    {
      key: "tech",
      header: "Tech",
      render: (r: TariffBidderRow) => (
        <Tag label={r.tech} color={TECH_COLORS[r.tech]} />
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (r: TariffBidderRow) => (
        <span className="text-muted">{r.project}</span>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "right" as const,
      render: (r: TariffBidderRow) => (
        <span className="num text-muted">{formatMW(r.capacityMW)}</span>
      ),
    },
    {
      key: "tariff",
      header: "Tariff",
      align: "right" as const,
      render: (r: TariffBidderRow) => (
        <span className="num font-semibold text-ink">
          {formatTariff(r.tariff)}/kWh
        </span>
      ),
    },
    {
      key: "period",
      header: "Period",
      align: "right" as const,
      render: (r: TariffBidderRow) => (
        <span className="num text-faint">{r.period}</span>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Price Discovery"
        title="Tariffs — Discovered Pricing"
        description="Discovered tariffs in Rs/kWh across solar, FDRE, hybrid, BESS and RTC — the 5-year trend, technology comparison, latest contracts and awarded-bidder pricing. Tariffs are mock until a live CERC-orders / tender-result parser is built; the CERC source-health probe is shown below."
        datasets={[{ label: "Discovered tariffs", meta: tariffData.meta }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">Filter</span>
        <GlobalFilters
          techOptions={techKeys.map((k) => ({ value: k, label: k }))}
          techLabel="Technology"
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Solar tariff"
          value={`${formatTariff(lastTrend.Solar)}`}
          unit="/kWh"
          caption={`${LATEST_PERIOD} · discovered`}
          delta={pctChange(lastTrend.Solar, prevTrend.Solar)}
          deltaLabel="QoQ"
          deltaInvertGood
          tone="amber"
          status="mock"
          icon={IndianRupee}
        />
        <StatTile
          label="FDRE tariff"
          value={`${formatTariff(lastTrend.FDRE)}`}
          unit="/kWh"
          caption={`${LATEST_PERIOD} · firm & dispatchable`}
          delta={pctChange(lastTrend.FDRE, prevTrend.FDRE)}
          deltaLabel="QoQ"
          deltaInvertGood
          tone="violet"
          status="mock"
          icon={Zap}
        />
        <StatTile
          label="BESS tariff"
          value={`${formatTariff(lastTrend.BESS)}`}
          unit="/kWh"
          caption={`${LATEST_PERIOD} · storage equivalent`}
          delta={pctChange(lastTrend.BESS, prevTrend.BESS)}
          deltaLabel="QoQ"
          deltaInvertGood
          tone="emerald"
          status="mock"
          icon={TrendingDown}
        />
        <StatTile
          label="RTC tariff"
          value={`${formatTariff(lastTrend.RTC)}`}
          unit="/kWh"
          caption={`${LATEST_PERIOD} · round-the-clock`}
          delta={pctChange(lastTrend.RTC, prevTrend.RTC)}
          deltaLabel="QoQ"
          deltaInvertGood
          tone="blue"
          status="mock"
          icon={Wallet}
        />
      </section>

      <section>
        <SectionTitle
          eyebrow="Tariff trends"
          title="Discovered pricing — 5-year window"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Discovered tariff trend"
            subtitle="Rs/kWh by technology, quarterly"
            meta={tariffData.meta}
            legend={trendSeries.map((s) => ({
              label: s.label,
              color: s.color,
            }))}
          >
            <TrendChart
              data={chartRows(trend)}
              xKey="period"
              height={260}
              series={trendSeries}
              yFormatter={(n) => `₹${n}`}
              valueFormatter={(n) => `${formatTariff(n)}/kWh`}
            />
          </ChartCard>
          <ChartCard
            title="Firm power vs vanilla solar"
            subtitle="Solar vs FDRE vs hybrid vs BESS — the dispatchability premium"
            meta={tariffData.meta}
            legend={comparisonSeries.map((s) => ({
              label: s.label,
              color: s.color,
            }))}
          >
            <TrendChart
              data={chartRows(tariffs.trend)}
              xKey="period"
              height={260}
              series={comparisonSeries}
              yFormatter={(n) => `₹${n}`}
              valueFormatter={(n) => `${formatTariff(n)}/kWh`}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-1"
            title="Tariff comparison by tender type"
            subtitle={`Latest discovered tariff · ${LATEST_PERIOD}`}
            meta={tariffData.meta}
          >
            <BarSeriesChart
              data={chartRows(latestByTech)}
              xKey="tech"
              height={250}
              series={[
                { key: "tariff", label: "Discovered tariff", color: CHART.amber },
              ]}
              yFormatter={(n) => `₹${n}`}
              valueFormatter={(n) => `${formatTariff(n)}/kWh`}
            />
          </ChartCard>
          <ChartCard
            className="xl:col-span-2"
            title="Awarded bidder tariffs"
            subtitle={`${bidders.length} awarded bids · capacity-tied pricing`}
            meta={tariffData.meta}
          >
            <DataTable
              columns={bidderColumns}
              rows={bidders}
              rowKey={(r) => `${r.player}-${r.project}`}
              empty={<EmptyState />}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Latest contracts"
          title="Recently announced contracts & orders"
        />
        {contracts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {contracts.map((c) => (
              <Panel
                key={c.id}
                hover
                className="flex flex-col gap-2 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <Tag label={c.tech} color={TECH_COLORS[c.tech]} />
                  <span className="num text-[11px] text-faint">{c.date}</span>
                </div>
                <div className="num text-2xl font-semibold text-ink">
                  {formatTariff(c.tariff)}
                  <span className="text-xs text-faint"> /kWh</span>
                </div>
                <div className="text-sm leading-snug font-medium text-ink">
                  {c.title}
                </div>
                <div className="mt-auto border-t border-line-soft pt-2 text-[11px] text-faint">
                  {c.winner} · {formatMW(c.capacityMW)} · {c.agency}
                </div>
              </Panel>
            ))}
          </div>
        ) : (
          <Panel className="p-4">
            <EmptyState />
          </Panel>
        )}
      </section>

      {cercSource && (
        <section>
          <SectionTitle
            eyebrow="Source health"
            title="Live tariff source — CERC"
            description="When this probe is reachable, CERC orders become the live feed for awarded-bidder tariffs."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SourceHealthCard entry={cercSource} />
          </div>
        </section>
      )}
    </div>
  );
}

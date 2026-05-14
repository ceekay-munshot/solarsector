"use client";

import { useState } from "react";
import { Gauge, Gavel, Layers, ListChecks } from "lucide-react";
import clsx from "clsx";
import { ChartCard } from "@/components/cards/ChartCard";
import { StatTile } from "@/components/cards/StatTile";
import { MixChart } from "@/components/charts/MixChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { useFilters } from "@/components/filters/FilterContext";
import { GlobalFilters } from "@/components/filters/GlobalFilters";
import { EmptyState } from "@/components/primitives/EmptyState";
import { PageHeader } from "@/components/primitives/PageHeader";
import { SectionTitle } from "@/components/primitives/SectionTitle";
import { Tag } from "@/components/primitives/Tag";
import { DataTable } from "@/components/tables/DataTable";
import { PlayerTable } from "@/components/tables/PlayerTable";
import { tenderData } from "@/data/datasets";
import { fyOf } from "@/data/periods";
import { CHART, TECH_COLORS, chartRows } from "@/lib/chartTheme";
import { filterByPeriod, matches } from "@/lib/filterData";
import { formatCapacity, formatMW, formatTariff } from "@/lib/format";
import { pctChange } from "@/lib/seededRandom";
import type { TenderPlayerRow, TenderRecord, TenderStage } from "@/lib/types";

const tenders = tenderData.value;

const techKeys = ["Solar", "FDRE", "Wind", "BESS", "Hybrid", "RTC"] as const;
const techSeries = techKeys.map((k) => ({
  key: k,
  label: k,
  color: TECH_COLORS[k],
}));

const STAGE_COLOR: Record<TenderStage, string> = {
  Awarded: CHART.emerald,
  "Under Evaluation": CHART.amber,
  "Bids Submitted": CHART.blue,
  Announced: CHART.violet,
};

const AGENCIES = ["All", "SECI", "NTPC", "NHPC", "SJVN", "State DISCOM"] as const;

function periodRank(period: string): number {
  const [q, fy] = period.split(" ");
  return Number(fy?.slice(2) ?? 0) * 4 + Number(q?.[1] ?? 0);
}

export default function TendersPage() {
  const f = useFilters();
  const [agency, setAgency] = useState<(typeof AGENCIES)[number]>("All");

  const awardTrend = filterByPeriod(tenders.quarterlyAwards, f);
  const mix = filterByPeriod(tenders.mix, f);

  const players = tenders.players.filter((p) => matches(p.player, f.player));

  const records = tenders.records
    .filter(
      (r) =>
        (f.fy === "all" || fyOf(r.period) === f.fy) &&
        (f.quarter === "all" || r.period.startsWith(f.quarter)) &&
        (f.tech === "all" || r.tech === f.tech) &&
        (f.player === "all" || r.winner === f.player) &&
        (agency === "All" || r.agency === agency),
    )
    .sort((a, b) => periodRank(b.period) - periodRank(a.period));

  const latestAward = tenders.quarterlyAwards[tenders.quarterlyAwards.length - 1];
  const prevAward = tenders.quarterlyAwards[tenders.quarterlyAwards.length - 2];
  const ttmAward = tenders.quarterlyAwards
    .slice(-4)
    .reduce((acc, q) => acc + q.awardedMW, 0);
  const lastMix = tenders.mix[tenders.mix.length - 1];
  const leadingTech = techKeys.reduce((best, k) =>
    lastMix[k] > lastMix[best] ? k : best,
  );

  const playerColumns = [
    {
      key: "awarded",
      header: "Awarded (5-yr)",
      align: "right" as const,
      render: (r: TenderPlayerRow) => (
        <span className="num text-ink">{formatCapacity(r.awardedMW)}</span>
      ),
    },
    {
      key: "count",
      header: "Tenders",
      align: "right" as const,
      render: (r: TenderPlayerRow) => (
        <span className="num text-muted">{r.tenderCount}</span>
      ),
    },
    {
      key: "tariff",
      header: "Avg tariff",
      align: "right" as const,
      render: (r: TenderPlayerRow) => (
        <span className="num text-muted">{formatTariff(r.avgTariff)}/kWh</span>
      ),
    },
  ];

  const recordColumns = [
    {
      key: "tender",
      header: "Tender",
      render: (r: TenderRecord) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{r.title}</div>
          <div className="text-[11px] text-faint">
            {r.agency} · {r.state ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "tech",
      header: "Tech",
      render: (r: TenderRecord) => (
        <Tag label={r.tech} color={TECH_COLORS[r.tech]} />
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "right" as const,
      render: (r: TenderRecord) => (
        <span className="num text-ink">{formatMW(r.capacityMW)}</span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      render: (r: TenderRecord) => (
        <Tag label={r.stage} color={STAGE_COLOR[r.stage]} />
      ),
    },
    {
      key: "tariff",
      header: "Tariff",
      align: "right" as const,
      render: (r: TenderRecord) => (
        <span className="num text-muted">
          {r.tariff ? `${formatTariff(r.tariff)}/kWh` : "—"}
        </span>
      ),
    },
    {
      key: "winner",
      header: "Winner",
      render: (r: TenderRecord) => (
        <span className="text-muted">{r.winner ?? "—"}</span>
      ),
    },
    {
      key: "period",
      header: "Period",
      align: "right" as const,
      render: (r: TenderRecord) => (
        <span className="num text-faint">{r.period}</span>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Tender Intelligence"
        title="Tenders — Awards & Technology Mix"
        description="Quarterly awarded capacity, the shift in technology mix toward FDRE / hybrid / RTC / BESS, and a live tender book. SECI is the live-first source — when the ingestion run cannot reach it, the dashboard falls back to a mock tender book and badges it honestly."
        datasets={[{ label: "Tenders (SECI live-first)", meta: tenderData.meta }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">Filter</span>
        <GlobalFilters
          playerOptions={tenders.players.map((p) => ({
            value: p.player,
            label: p.player,
          }))}
          techOptions={techKeys.map((k) => ({ value: k, label: k }))}
          techLabel="Technology"
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Awarded this quarter"
          value={formatCapacity(latestAward.awardedMW)}
          caption={`${latestAward.period} · all technologies`}
          delta={pctChange(latestAward.awardedMW, prevAward.awardedMW)}
          deltaLabel="QoQ"
          tone="amber"
          status="mock"
          icon={Gavel}
        />
        <StatTile
          label="Trailing 4-quarter awards"
          value={formatCapacity(ttmAward)}
          caption="Rolling 12-month awarded capacity"
          tone="blue"
          status="mock"
          icon={Gauge}
        />
        <StatTile
          label="Leading technology"
          value={leadingTech}
          caption={`${formatCapacity(lastMix[leadingTech])} awarded last quarter`}
          tone="violet"
          status="mock"
          icon={Layers}
        />
        <StatTile
          label="Tracked tender book"
          value={`${tenders.records.length} tenders`}
          caption={
            tenderData.meta.status === "live"
              ? "SECI live snapshot"
              : "SECI mock fallback"
          }
          tone="emerald"
          status={tenderData.meta.status}
          icon={ListChecks}
        />
      </section>

      <section>
        <SectionTitle
          eyebrow="Award momentum"
          title="Quarterly awards & technology mix"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Tenders awarded — quarterly"
            subtitle="Total awarded capacity per quarter, 5-year window"
            meta={tenderData.meta}
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
          <ChartCard
            title="Tender mix by technology"
            subtitle="Solar · FDRE · wind · BESS · hybrid · RTC"
            meta={tenderData.meta}
            legend={techSeries.map((s) => ({ label: s.label, color: s.color }))}
          >
            <MixChart
              data={chartRows(mix)}
              xKey="period"
              series={techSeries}
              height={260}
              yFormatter={(n) => `${Math.round(n / 1000)}GW`}
              valueFormatter={(n) => formatMW(n)}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Developer league"
          title="Player-wise tender awards"
        />
        <ChartCard
          title="Awards by developer"
          subtitle={`${players.length} developers · cumulative awarded capacity, FY22–FY26`}
          meta={tenderData.meta}
        >
          <PlayerTable
            rows={players}
            rowKey={(r) => r.player}
            playerName={(r) => r.player}
            columns={playerColumns}
            empty={<EmptyState />}
          />
        </ChartCard>
      </section>

      <section>
        <SectionTitle
          eyebrow="Tender book"
          title="Tender list"
          description="SECI live records when the ingestion run succeeds; mock fallback otherwise."
          action={
            <div className="flex flex-wrap gap-1">
              {AGENCIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAgency(a)}
                  className={clsx(
                    "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                    agency === a
                      ? "border-amber/40 bg-amber/10 text-amber"
                      : "border-line bg-surface-2/60 text-faint hover:text-muted",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          }
        />
        <ChartCard
          title={`Tenders — ${records.length} matching`}
          subtitle="Issued, under evaluation, bid-submitted and awarded tenders"
          meta={tenderData.meta}
        >
          <DataTable
            columns={recordColumns}
            rows={records}
            rowKey={(r) => r.id}
            empty={<EmptyState />}
          />
        </ChartCard>
      </section>
    </div>
  );
}

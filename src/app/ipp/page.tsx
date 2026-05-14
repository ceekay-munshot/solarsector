"use client";

import { Building2, FileCheck, Hammer, Layers } from "lucide-react";
import { ChartCard } from "@/components/cards/ChartCard";
import { StatTile } from "@/components/cards/StatTile";
import { DonutChart } from "@/components/charts/DonutChart";
import { useFilters } from "@/components/filters/FilterContext";
import { GlobalFilters } from "@/components/filters/GlobalFilters";
import { EmptyState } from "@/components/primitives/EmptyState";
import { PageHeader } from "@/components/primitives/PageHeader";
import { SectionTitle } from "@/components/primitives/SectionTitle";
import { PlayerTable } from "@/components/tables/PlayerTable";
import { RankingTable } from "@/components/tables/RankingTable";
import { ippData } from "@/data/datasets";
import { CHART } from "@/lib/chartTheme";
import { matches } from "@/lib/filterData";
import { formatCapacity, formatMW } from "@/lib/format";
import type { IppPlayer, IppTechSlice } from "@/lib/types";

const ippPlayers = ippData.value;

const IPP_TECH_COLORS: Record<string, string> = {
  Solar: CHART.amber,
  Wind: CHART.blue,
  Hybrid: CHART.orange,
  Hydro: CHART.cyan,
  FDRE: CHART.violet,
};

const allTechs = Array.from(
  new Set(ippPlayers.flatMap((p) => p.techMix.map((t) => t.tech))),
);

function TechMixBar({ mix }: { mix: IppTechSlice[] }) {
  const total = mix.reduce((acc, t) => acc + t.mw, 0) || 1;
  const dominant = [...mix].sort((a, b) => b.mw - a.mw)[0];
  return (
    <div className="ml-auto flex w-fit items-center gap-2">
      <div className="flex h-2 w-24 overflow-hidden rounded-full bg-white/5">
        {mix.map((t) => (
          <div
            key={t.tech}
            style={{
              width: `${(t.mw / total) * 100}%`,
              background: IPP_TECH_COLORS[t.tech] ?? CHART.slate,
            }}
          />
        ))}
      </div>
      <span className="text-[11px] whitespace-nowrap text-faint">
        {dominant?.tech}
      </span>
    </div>
  );
}

export default function IppPage() {
  const f = useFilters();

  const players = ippPlayers.filter(
    (p) =>
      matches(p.name, f.player) &&
      (f.tech === "all" || p.techMix.some((t) => t.tech === f.tech)),
  );

  const totalOperational = players.reduce((a, p) => a + p.operationalMW, 0);
  const totalConstruction = players.reduce(
    (a, p) => a + p.underConstructionMW,
    0,
  );
  const totalPipeline = players.reduce((a, p) => a + p.pipelineMW, 0);
  const totalPpa = players.reduce((a, p) => a + p.ppaAwardedMW, 0);

  const operationalLeaders = [...players]
    .sort((a, b) => b.operationalMW - a.operationalMW)
    .map((p) => ({
      id: p.id,
      name: p.name,
      value: p.operationalMW,
      displayValue: formatCapacity(p.operationalMW),
      secondary: `${formatCapacity(p.underConstructionMW)} U/C`,
      color: CHART.emerald,
    }));

  const pipelineLeaders = [...players]
    .sort((a, b) => b.pipelineMW - a.pipelineMW)
    .map((p) => ({
      id: p.id,
      name: p.name,
      value: p.pipelineMW,
      displayValue: formatCapacity(p.pipelineMW),
      secondary: `${formatCapacity(p.ppaAwardedMW)} PPA`,
      color: CHART.violet,
    }));

  const techTotals = new Map<string, number>();
  for (const p of players) {
    for (const t of p.techMix) {
      techTotals.set(t.tech, (techTotals.get(t.tech) ?? 0) + t.mw);
    }
  }
  const donutData = allTechs
    .filter((t) => techTotals.has(t))
    .map((t) => ({
      name: t,
      value: techTotals.get(t) ?? 0,
      color: IPP_TECH_COLORS[t] ?? CHART.slate,
    }));

  const detailColumns = [
    {
      key: "operational",
      header: "Operational",
      align: "right" as const,
      render: (r: IppPlayer) => (
        <span className="num text-ink">{formatMW(r.operationalMW)}</span>
      ),
    },
    {
      key: "construction",
      header: "Under constr.",
      align: "right" as const,
      render: (r: IppPlayer) => (
        <span className="num text-muted">
          {formatMW(r.underConstructionMW)}
        </span>
      ),
    },
    {
      key: "pipeline",
      header: "Pipeline",
      align: "right" as const,
      render: (r: IppPlayer) => (
        <span className="num text-muted">{formatMW(r.pipelineMW)}</span>
      ),
    },
    {
      key: "ppa",
      header: "PPA awarded",
      align: "right" as const,
      render: (r: IppPlayer) => (
        <span className="num text-muted">{formatMW(r.ppaAwardedMW)}</span>
      ),
    },
    {
      key: "mix",
      header: "Technology mix",
      align: "right" as const,
      render: (r: IppPlayer) => <TechMixBar mix={r.techMix} />,
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Developer Intelligence"
        title="IPP — Developer Pipelines"
        description="India's independent power producers ranked by operational capacity, under-construction build-out, secured pipeline and PPA-tied capacity, with the technology mix per developer. Mock until company-level disclosure ingestion is built."
        datasets={[{ label: "IPP league table", meta: ippData.meta }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">Filter</span>
        <GlobalFilters
          showFy={false}
          showQuarter={false}
          playerOptions={ippPlayers.map((p) => ({
            value: p.name,
            label: p.name,
          }))}
          techOptions={allTechs.map((t) => ({ value: t, label: t }))}
          techLabel="Technology"
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Operational capacity"
          value={formatCapacity(totalOperational)}
          caption={`${players.length} tracked developers`}
          tone="emerald"
          status="mock"
          icon={Building2}
        />
        <StatTile
          label="Under construction"
          value={formatCapacity(totalConstruction)}
          caption="Capacity being built out"
          tone="amber"
          status="mock"
          icon={Hammer}
        />
        <StatTile
          label="Secured pipeline"
          value={formatCapacity(totalPipeline)}
          caption="Awarded, pre-construction"
          tone="violet"
          status="mock"
          icon={Layers}
        />
        <StatTile
          label="PPA-tied capacity"
          value={formatCapacity(totalPpa)}
          caption="Cumulative PPA awards"
          tone="blue"
          status="mock"
          icon={FileCheck}
        />
      </section>

      <section>
        <SectionTitle
          eyebrow="Leaderboards"
          title="Operational scale, pipeline & technology mix"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Operational capacity leaderboard"
            subtitle="Live utility-scale capacity by developer"
            meta={ippData.meta}
          >
            <div className="py-1">
              <RankingTable
                rows={operationalLeaders}
                empty={<EmptyState />}
              />
            </div>
          </ChartCard>
          <ChartCard
            title="Secured pipeline leaderboard"
            subtitle="Awarded, pre-construction capacity by developer"
            meta={ippData.meta}
          >
            <div className="py-1">
              <RankingTable rows={pipelineLeaders} empty={<EmptyState />} />
            </div>
          </ChartCard>
          <ChartCard
            title="Industry technology mix"
            subtitle="Operational capacity by technology, tracked developers"
            meta={ippData.meta}
            legend={donutData.map((d) => ({
              label: d.name,
              color: d.color,
            }))}
          >
            {donutData.length > 0 ? (
              <DonutChart
                data={donutData}
                height={236}
                centerValue={formatCapacity(totalOperational)}
                centerLabel="operational"
                valueFormatter={(n) => formatMW(n)}
              />
            ) : (
              <EmptyState />
            )}
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Developer detail"
          title="Player-by-player breakdown"
        />
        <ChartCard
          title="IPP developer detail"
          subtitle={`${players.length} developers · operational, under-construction, pipeline, PPA and technology mix`}
          meta={ippData.meta}
        >
          <PlayerTable
            rows={[...players].sort(
              (a, b) =>
                b.operationalMW +
                b.underConstructionMW +
                b.pipelineMW -
                (a.operationalMW + a.underConstructionMW + a.pipelineMW),
            )}
            rowKey={(r) => r.id}
            playerName={(r) => r.name}
            playerMeta={(r) => r.hq}
            columns={detailColumns}
            empty={<EmptyState />}
          />
        </ChartCard>
      </section>
    </div>
  );
}

"use client";

import { Activity, Boxes, Cpu, Factory } from "lucide-react";
import { ChartCard } from "@/components/cards/ChartCard";
import { StatTile } from "@/components/cards/StatTile";
import { Sparkline } from "@/components/charts/Sparkline";
import { TrendChart } from "@/components/charts/TrendChart";
import { useFilters } from "@/components/filters/FilterContext";
import { GlobalFilters } from "@/components/filters/GlobalFilters";
import { EmptyState } from "@/components/primitives/EmptyState";
import { PageHeader } from "@/components/primitives/PageHeader";
import { SectionTitle } from "@/components/primitives/SectionTitle";
import { PlayerTable } from "@/components/tables/PlayerTable";
import { dcrData } from "@/data/datasets";
import { LATEST_PERIOD } from "@/data/periods";
import { CHART, chartRows } from "@/lib/chartTheme";
import { filterByPeriod, matches } from "@/lib/filterData";
import { formatMW, formatPct } from "@/lib/format";
import { pctChange } from "@/lib/seededRandom";
import type { DcrPlayerRow } from "@/lib/types";

const dcr = dcrData.value;

const playerOptions = Array.from(
  new Set([...dcr.modulePlayers, ...dcr.cellPlayers].map((p) => p.player)),
)
  .sort()
  .map((p) => ({ value: p, label: p }));

export default function DcrPage() {
  const f = useFilters();

  const quarterly = filterByPeriod(dcr.quarterly, f);
  const latest = dcr.quarterly[dcr.quarterly.length - 1];
  const prev = dcr.quarterly[dcr.quarterly.length - 2];
  const gap = latest.moduleMW - latest.cellMW;
  const prevGap = prev.moduleMW - prev.cellMW;

  const showModule = f.tech === "all" || f.tech === "module";
  const showCell = f.tech === "all" || f.tech === "cell";

  const modulePlayers = dcr.modulePlayers.filter((p) =>
    matches(p.player, f.player),
  );
  const cellPlayers = dcr.cellPlayers.filter((p) => matches(p.player, f.player));

  const playerColumns = (color: string) => [
    {
      key: "latest",
      header: `${LATEST_PERIOD} (MW)`,
      align: "right" as const,
      render: (r: DcrPlayerRow) => (
        <span className="num text-ink">{formatMW(r.latestMW)}</span>
      ),
    },
    {
      key: "ttm",
      header: "TTM (MW)",
      align: "right" as const,
      render: (r: DcrPlayerRow) => (
        <span className="num text-muted">{formatMW(r.ttmMW)}</span>
      ),
    },
    {
      key: "share",
      header: "Share",
      align: "right" as const,
      render: (r: DcrPlayerRow) => (
        <span className="num text-muted">{formatPct(r.sharePct)}</span>
      ),
    },
    {
      key: "qoq",
      header: "QoQ",
      align: "right" as const,
      render: (r: DcrPlayerRow) => (
        <span
          className={`num ${r.qoqPct >= 0 ? "text-emerald" : "text-red"}`}
        >
          {r.qoqPct >= 0 ? "+" : ""}
          {formatPct(r.qoqPct)}
        </span>
      ),
    },
    {
      key: "trend",
      header: "5-yr trend",
      align: "right" as const,
      render: (r: DcrPlayerRow) => (
        <div className="ml-auto h-7 w-24">
          <Sparkline data={r.byPeriod.map((b) => b.mw)} color={color} height={28} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Domestic Manufacturing"
        title="DCR — Module & Cell Production"
        description="Quarterly DCR (Domestic Content Requirement) module and cell production — industry totals and player-wise output across a 5-year window. Player-wise DCR output is not published in any single public feed; these figures are mock and the live-ingestion feasibility risk is documented in SOLAR_DASHBOARD_PLAN.md."
        datasets={[{ label: "DCR module & cell", meta: dcrData.meta }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">Filter</span>
        <GlobalFilters
          playerOptions={playerOptions}
          techOptions={[
            { value: "module", label: "Module" },
            { value: "cell", label: "Cell" },
          ]}
          techLabel="Segment"
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="DCR module output"
          value={formatMW(latest.moduleMW)}
          caption={`${LATEST_PERIOD} · per quarter`}
          delta={pctChange(latest.moduleMW, prev.moduleMW)}
          deltaLabel="QoQ"
          tone="amber"
          status="mock"
          icon={Factory}
        />
        <StatTile
          label="DCR cell output"
          value={formatMW(latest.cellMW)}
          caption={`${LATEST_PERIOD} · per quarter`}
          delta={pctChange(latest.cellMW, prev.cellMW)}
          deltaLabel="QoQ"
          tone="emerald"
          status="mock"
          icon={Cpu}
        />
        <StatTile
          label="Combined DCR output"
          value={formatMW(latest.moduleMW + latest.cellMW)}
          caption={`${LATEST_PERIOD} · module + cell`}
          delta={pctChange(
            latest.moduleMW + latest.cellMW,
            prev.moduleMW + prev.cellMW,
          )}
          deltaLabel="QoQ"
          tone="blue"
          status="mock"
          icon={Boxes}
        />
        <StatTile
          label="Module–cell gap"
          value={formatMW(gap)}
          caption="Module output less cell output"
          delta={pctChange(gap, prevGap)}
          deltaLabel="QoQ"
          deltaInvertGood
          tone="violet"
          status="mock"
          icon={Activity}
        />
      </section>

      <section>
        <SectionTitle
          eyebrow="Production trends"
          title="Quarterly production — 5-year window"
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {showModule && (
            <ChartCard
              title="DCR module production"
              subtitle="Industry total, MW per quarter"
              meta={dcrData.meta}
              legend={[{ label: "Module output", color: CHART.amber }]}
            >
              <TrendChart
                data={chartRows(quarterly)}
                xKey="period"
                area
                height={250}
                series={[
                  { key: "moduleMW", label: "Module output", color: CHART.amber },
                ]}
                yFormatter={(n) => `${Math.round(n / 1000)}GW`}
                valueFormatter={(n) => formatMW(n)}
              />
            </ChartCard>
          )}
          {showCell && (
            <ChartCard
              title="DCR cell production"
              subtitle="Industry total, MW per quarter"
              meta={dcrData.meta}
              legend={[{ label: "Cell output", color: CHART.emerald }]}
            >
              <TrendChart
                data={chartRows(quarterly)}
                xKey="period"
                area
                height={250}
                series={[
                  { key: "cellMW", label: "Cell output", color: CHART.emerald },
                ]}
                yFormatter={(n) => `${Math.round(n / 1000)}GW`}
                valueFormatter={(n) => formatMW(n)}
              />
            </ChartCard>
          )}
        </div>
      </section>

      <section>
        <ChartCard
          title="Module vs cell — the production gap"
          subtitle="India's cell base is closing the gap with module capacity, but the two are not yet matched"
          meta={dcrData.meta}
          legend={[
            { label: "Module output", color: CHART.amber },
            { label: "Cell output", color: CHART.emerald },
          ]}
        >
          <TrendChart
            data={chartRows(quarterly)}
            xKey="period"
            height={260}
            series={[
              { key: "moduleMW", label: "Module output", color: CHART.amber },
              { key: "cellMW", label: "Cell output", color: CHART.emerald },
            ]}
            yFormatter={(n) => `${Math.round(n / 1000)}GW`}
            valueFormatter={(n) => formatMW(n)}
          />
        </ChartCard>
      </section>

      <section>
        <SectionTitle
          eyebrow="Player-wise output"
          title="Producers by segment"
          description="Player-wise DCR output is mock — live ingestion needs MNRE ALMM + the DCR verification portal cross-checked. See the Sources tab."
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {showModule && (
            <ChartCard
              title="DCR module producers"
              subtitle={`${modulePlayers.length} players · ranked by latest quarter`}
              meta={dcrData.meta}
            >
              <PlayerTable
                rows={modulePlayers}
                rowKey={(r) => `m-${r.player}`}
                playerName={(r) => r.player}
                accent={() => CHART.amber}
                columns={playerColumns(CHART.amber)}
                empty={<EmptyState />}
              />
            </ChartCard>
          )}
          {showCell && (
            <ChartCard
              title="DCR cell producers"
              subtitle={`${cellPlayers.length} players · ranked by latest quarter`}
              meta={dcrData.meta}
            >
              <PlayerTable
                rows={cellPlayers}
                rowKey={(r) => `c-${r.player}`}
                playerName={(r) => r.player}
                accent={() => CHART.emerald}
                columns={playerColumns(CHART.emerald)}
                empty={<EmptyState />}
              />
            </ChartCard>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { Database, RadioTower, ShieldAlert, ShieldCheck } from "lucide-react";
import { ChartCard } from "@/components/cards/ChartCard";
import { SourceHealthCard } from "@/components/cards/SourceHealthCard";
import { StatTile } from "@/components/cards/StatTile";
import { useFilters } from "@/components/filters/FilterContext";
import { GlobalFilters } from "@/components/filters/GlobalFilters";
import { EmptyState } from "@/components/primitives/EmptyState";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Panel } from "@/components/primitives/Panel";
import { SectionTitle } from "@/components/primitives/SectionTitle";
import { DataTable } from "@/components/tables/DataTable";
import {
  sourceHealthGeneratedAt,
  sourceRegistry,
} from "@/data/sources";
import { PROBE_STATUS } from "@/lib/dataStatus";
import { formatFreshness } from "@/lib/format";
import { tone } from "@/lib/tone";
import type { SourceRegistryEntry } from "@/lib/types";

const categories = Array.from(
  new Set(sourceRegistry.map((s) => s.category)),
);

const reachable = sourceRegistry.filter((s) => s.status === "live").length;
const degraded = sourceRegistry.filter((s) => s.status === "fallback").length;
const dormant = sourceRegistry.filter(
  (s) => s.status === "probe_failed" || s.status === "pending",
).length;

function StatusChip({ status }: { status: SourceRegistryEntry["status"] }) {
  const cfg = PROBE_STATUS[status];
  const t = tone(cfg.tone);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        t.fill,
        t.border,
        t.text,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", t.dot)} />
      {cfg.label}
    </span>
  );
}

export default function SourcesPage() {
  const f = useFilters();

  const filtered = sourceRegistry.filter(
    (e) =>
      (f.status === "all" || e.status === f.status) &&
      (f.tech === "all" || e.category === f.tech),
  );

  const roadmap = [...filtered].sort(
    (a, b) => a.ingestionPriority - b.ingestionPriority,
  );

  const roadmapColumns = [
    {
      key: "priority",
      header: "Priority",
      align: "center" as const,
      render: (r: SourceRegistryEntry) => (
        <span className="num inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-xs font-semibold text-muted">
          {r.ingestionPriority}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (r: SourceRegistryEntry) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{r.name}</div>
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-[11px] text-faint hover:text-blue"
          >
            {r.url}
          </a>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (r: SourceRegistryEntry) => (
        <span className="text-muted">{r.category}</span>
      ),
    },
    {
      key: "use",
      header: "Planned use",
      render: (r: SourceRegistryEntry) => (
        <span className="text-muted">{r.plannedUse}</span>
      ),
    },
    {
      key: "pages",
      header: "Pages",
      render: (r: SourceRegistryEntry) => (
        <span className="text-faint">{r.pages.join(", ")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: SourceRegistryEntry) => <StatusChip status={r.status} />,
    },
    {
      key: "checked",
      header: "Last checked",
      align: "right" as const,
      render: (r: SourceRegistryEntry) => (
        <span className="text-faint">{formatFreshness(r.lastChecked)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Data Provenance"
        title="Sources — Registry & Health"
        description="Every upstream source this dashboard uses or plans to use — what it feeds, its live-probe health, and its ingestion priority. This is a mixed-data prototype: live data is fetched where reachable, mock fallback is used elsewhere, and every visual badges its provenance."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">Filter</span>
        <GlobalFilters
          showFy={false}
          showQuarter={false}
          techOptions={categories.map((c) => ({ value: c, label: c }))}
          techLabel="Category"
        />
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            The ingestion script probes each source on every run and commits a
            health snapshot. SECI is the live-first data source; the rest are
            health-probed today and scheduled for ingestion in priority order.
            See <span className="text-ink">SOLAR_DASHBOARD_PLAN.md</span> for
            the page-by-page source mapping and the live-ingestion roadmap.
          </p>
          <span className="text-[11px] text-faint">
            Last probe run: {formatFreshness(sourceHealthGeneratedAt)}
          </span>
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Tracked sources"
          value={String(sourceRegistry.length)}
          caption="In the ingestion registry"
          tone="blue"
          icon={Database}
        />
        <StatTile
          label="Reachable"
          value={String(reachable)}
          caption="Responded OK to last probe"
          tone="emerald"
          icon={ShieldCheck}
        />
        <StatTile
          label="Degraded"
          value={String(degraded)}
          caption="Responded, but not usable"
          tone="orange"
          icon={ShieldAlert}
        />
        <StatTile
          label="Failed / pending"
          value={String(dormant)}
          caption="No response or not yet probed"
          tone="neutral"
          icon={RadioTower}
        />
      </section>

      <section>
        <SectionTitle
          eyebrow="Source health"
          title="Live probe results"
          description={`${filtered.length} of ${sourceRegistry.length} sources shown`}
        />
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((entry) => (
              <SourceHealthCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <Panel className="p-4">
            <EmptyState
              title="No sources match these filters"
              message="Adjust the category or data-status filter to see sources."
            />
          </Panel>
        )}
      </section>

      <section>
        <SectionTitle
          eyebrow="Ingestion roadmap"
          title="Source registry — priority order"
        />
        <ChartCard
          title="Data source registry"
          subtitle="Every source, what it feeds, and its place in the ingestion queue"
          meta={{
            status: "live",
            sourceName: "Source health probes",
            note: "Probe results are live — they record each source's last-run reachability. The data feeds themselves are mostly mock pending ingestion.",
            lastChecked: sourceHealthGeneratedAt || undefined,
          }}
        >
          <DataTable
            columns={roadmapColumns}
            rows={roadmap}
            rowKey={(r) => r.id}
            empty={<EmptyState />}
          />
        </ChartCard>
      </section>
    </div>
  );
}

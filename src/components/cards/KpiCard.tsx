"use client";

import clsx from "clsx";
import { DataBadge } from "@/components/badges/DataBadge";
import { Sparkline } from "@/components/charts/Sparkline";
import { useStatusDim } from "@/components/filters/FilterContext";
import { DeltaPill } from "@/components/primitives/DeltaPill";
import { Panel } from "@/components/primitives/Panel";
import { tone } from "@/lib/tone";
import type { KpiStat } from "@/lib/types";

/** Executive KPI tile — headline figure, delta, sparkline and a data badge. */
export function KpiCard({ stat }: { stat: KpiStat }) {
  const t = tone(stat.tone);
  const dimmed = useStatusDim(stat.status);
  return (
    <Panel
      hover
      className={clsx(
        "relative overflow-hidden p-4 transition-opacity duration-300",
        dimmed && "opacity-40",
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r to-transparent",
          t.glow,
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted">{stat.label}</span>
        <DataBadge status={stat.status} size="sm" compact />
      </div>

      <div className="mt-2.5 flex items-baseline gap-1">
        <span className="num text-[1.6rem] leading-none font-semibold tracking-tight text-ink">
          {stat.value}
        </span>
        {stat.unit && <span className="text-xs text-faint">{stat.unit}</span>}
      </div>

      {stat.deltaPct !== undefined && (
        <div className="mt-2">
          <DeltaPill value={stat.deltaPct} label={stat.deltaLabel} />
        </div>
      )}

      {stat.trend && stat.trend.length > 1 && (
        <div className="mt-2.5">
          <Sparkline data={stat.trend} color={t.hex} />
        </div>
      )}

      {stat.caption && (
        <p className="mt-2 text-[11px] text-faint">{stat.caption}</p>
      )}
    </Panel>
  );
}

"use client";

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { DataBadge } from "@/components/badges/DataBadge";
import { useStatusDim } from "@/components/filters/FilterContext";
import { DeltaPill } from "@/components/primitives/DeltaPill";
import { Panel } from "@/components/primitives/Panel";
import { tone } from "@/lib/tone";
import type { AccentTone, DataStatus } from "@/lib/types";

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  deltaInvertGood?: boolean;
  caption?: string;
  tone?: AccentTone;
  status?: DataStatus;
  icon?: LucideIcon;
}

/** Compact stat — used for "industry total" rows and secondary metrics. */
export function StatTile({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  deltaInvertGood,
  caption,
  tone: toneName = "neutral",
  status,
  icon: Icon,
}: StatTileProps) {
  const t = tone(toneName);
  const dimmed = useStatusDim(status ?? "live") && status !== undefined;
  return (
    <Panel
      hover
      className={clsx(
        "flex flex-col gap-2 p-4 transition-opacity duration-300",
        dimmed && "opacity-40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
          {Icon && (
            <span
              className={clsx(
                "inline-flex h-6 w-6 items-center justify-center rounded-md",
                t.fill,
                t.text,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          {label}
        </span>
        {status && <DataBadge status={status} size="sm" compact />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="num text-xl font-semibold tracking-tight text-ink">
          {value}
        </span>
        {unit && <span className="text-xs text-faint">{unit}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        {delta !== undefined ? (
          <DeltaPill
            value={delta}
            label={deltaLabel}
            invertGood={deltaInvertGood}
            size="sm"
          />
        ) : (
          <span />
        )}
        {caption && <span className="text-[11px] text-faint">{caption}</span>}
      </div>
    </Panel>
  );
}

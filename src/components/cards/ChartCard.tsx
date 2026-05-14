"use client";

import clsx from "clsx";
import { DataBadge } from "@/components/badges/DataBadge";
import { FreshnessBadge } from "@/components/badges/FreshnessBadge";
import { SourceBadge } from "@/components/badges/SourceBadge";
import { useStatusDim } from "@/components/filters/FilterContext";
import { Legend } from "@/components/primitives/Legend";
import { Panel } from "@/components/primitives/Panel";
import type { SourceMeta } from "@/lib/types";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  meta: SourceMeta;
  legend?: { label: string; color: string }[];
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Footer text shown when there is no lastChecked timestamp. */
  footnote?: string;
}

/** Standard frame for every chart: header, provenance badge, legend, source. */
export function ChartCard({
  title,
  subtitle,
  meta,
  legend,
  action,
  children,
  className,
  footnote,
}: ChartCardProps) {
  const dimmed = useStatusDim(meta.status);
  return (
    <Panel
      hover
      className={clsx(
        "flex flex-col p-5 transition-opacity duration-300",
        dimmed && "opacity-40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-faint">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          <DataBadge status={meta.status} size="sm" />
        </div>
      </div>

      {legend && legend.length > 0 && (
        <div className="mt-3">
          <Legend items={legend} />
        </div>
      )}

      <div className="mt-3 flex-1">{children}</div>

      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
        <SourceBadge name={meta.sourceName} url={meta.sourceUrl} />
        {meta.lastChecked ? (
          <FreshnessBadge iso={meta.lastChecked} />
        ) : footnote ? (
          <span className="shrink-0 text-[11px] text-faint">{footnote}</span>
        ) : null}
      </div>

      {meta.note && (
        <p className="mt-2 text-[11px] leading-relaxed text-faint/85">
          {meta.note}
        </p>
      )}
    </Panel>
  );
}

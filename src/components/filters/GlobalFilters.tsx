"use client";

import clsx from "clsx";
import {
  Activity,
  Building2,
  Calendar,
  CalendarRange,
  Layers,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FISCAL_YEARS, QUARTERS } from "@/data/periods";
import { DATA_STATUS, DATA_STATUS_ORDER } from "@/lib/dataStatus";
import { useFilters } from "./FilterContext";

interface Option {
  value: string;
  label: string;
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  active,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  active: boolean;
}) {
  return (
    <label
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
        active
          ? "border-amber/40 bg-amber/[0.07]"
          : "border-line bg-surface-2/70 hover:border-white/20",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-faint" />
      <span className="text-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-1 font-medium text-ink outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-2 text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface GlobalFiltersProps {
  playerOptions?: Option[];
  techOptions?: Option[];
  techLabel?: string;
  /** Hide the quarter filter where it isn't meaningful (e.g. monthly demand). */
  showQuarter?: boolean;
  /** Hide the FY filter on point-in-time pages (e.g. IPP league table). */
  showFy?: boolean;
}

/**
 * The dashboard's reusable filter bar. FY / quarter / data-status are global;
 * player and technology options are page-specific and passed in by each page.
 */
export function GlobalFilters({
  playerOptions,
  techOptions,
  techLabel = "Technology",
  showQuarter = true,
  showFy = true,
}: GlobalFiltersProps) {
  const f = useFilters();

  const fyOptions: Option[] = [
    { value: "all", label: "All FY" },
    ...FISCAL_YEARS.map((y) => ({ value: y, label: y })),
  ];
  const quarterOptions: Option[] = [
    { value: "all", label: "All quarters" },
    ...QUARTERS.map((q) => ({ value: q, label: q })),
  ];
  const statusOptions: Option[] = [
    { value: "all", label: "All data" },
    ...DATA_STATUS_ORDER.map((s) => ({ value: s, label: DATA_STATUS[s].label })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showFy && (
        <FilterSelect
          icon={Calendar}
          label="FY"
          value={f.fy}
          options={fyOptions}
          onChange={(v) => f.set({ fy: v })}
          active={f.fy !== "all"}
        />
      )}
      {showQuarter && (
        <FilterSelect
          icon={CalendarRange}
          label="Qtr"
          value={f.quarter}
          options={quarterOptions}
          onChange={(v) => f.set({ quarter: v })}
          active={f.quarter !== "all"}
        />
      )}
      {playerOptions && playerOptions.length > 0 && (
        <FilterSelect
          icon={Building2}
          label="Player"
          value={f.player}
          options={[{ value: "all", label: "All players" }, ...playerOptions]}
          onChange={(v) => f.set({ player: v })}
          active={f.player !== "all"}
        />
      )}
      {techOptions && techOptions.length > 0 && (
        <FilterSelect
          icon={Layers}
          label={techLabel}
          value={f.tech}
          options={[
            { value: "all", label: `All ${techLabel.toLowerCase()}` },
            ...techOptions,
          ]}
          onChange={(v) => f.set({ tech: v })}
          active={f.tech !== "all"}
        />
      )}
      <FilterSelect
        icon={Activity}
        label="Data"
        value={f.status}
        options={statusOptions}
        onChange={(v) => f.set({ status: v })}
        active={f.status !== "all"}
      />
      {f.activeCount > 0 && (
        <button
          type="button"
          onClick={f.reset}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2/70 px-2.5 py-1.5 text-xs text-faint transition-colors hover:border-white/20 hover:text-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset ({f.activeCount})
        </button>
      )}
    </div>
  );
}

"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useMounted } from "@/lib/useMounted";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartTooltip } from "./ChartTooltip";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  valueFormatter?: (n: number) => string;
}

/** Donut for share / mix snapshots, with an optional centred label. */
export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
  valueFormatter,
}: DonutChartProps) {
  const mounted = useMounted();
  if (!mounted) return <ChartSkeleton height={height} />;
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                formatter={
                  valueFormatter ? (v: number) => valueFormatter(v) : undefined
                }
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="num text-xl font-semibold text-ink">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="mt-0.5 max-w-[70%] text-center text-[11px] text-faint">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

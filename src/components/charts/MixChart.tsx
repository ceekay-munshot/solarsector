"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisProps, gridProps } from "@/lib/chartTheme";
import { useMounted } from "@/lib/useMounted";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartTooltip } from "./ChartTooltip";
import type { ChartSeries } from "./TrendChart";

interface MixChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: ChartSeries[];
  height?: number;
  yFormatter?: (n: number) => string;
  valueFormatter?: (n: number, name: string) => string;
  /** Stack the series (true) or render them grouped (false). */
  stacked?: boolean;
}

/** Stacked / grouped bar chart for technology and source mixes. */
export function MixChart({
  data,
  xKey,
  series,
  height = 280,
  yFormatter,
  valueFormatter,
  stacked = true,
}: MixChartProps) {
  const mounted = useMounted();
  if (!mounted) return <ChartSkeleton height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 6, right: 10, bottom: 0, left: -6 }}
        barCategoryGap={stacked ? "24%" : "16%"}
      >
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey={xKey}
          {...axisProps}
          interval="preserveStartEnd"
          minTickGap={14}
        />
        <YAxis {...axisProps} width={54} tickFormatter={yFormatter} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={<ChartTooltip formatter={valueFormatter} hideZero={stacked} />}
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? "stack" : undefined}
            fill={s.color}
            radius={
              stacked
                ? i === series.length - 1
                  ? [3, 3, 0, 0]
                  : [0, 0, 0, 0]
                : [3, 3, 0, 0]
            }
            maxBarSize={stacked ? 48 : 30}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

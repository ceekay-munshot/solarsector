"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART, axisProps, gridProps } from "@/lib/chartTheme";
import { useMounted } from "@/lib/useMounted";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartTooltip } from "./ChartTooltip";
import type { ChartSeries } from "./TrendChart";

interface BarSeriesChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: ChartSeries[];
  height?: number;
  yFormatter?: (n: number) => string;
  valueFormatter?: (n: number, name: string) => string;
  /** Colour each bar by sign (emerald positive / red negative) — single series. */
  signColors?: boolean;
  /** Draw a zero reference line. */
  zeroLine?: boolean;
}

/** Single or grouped bar chart — growth %, monthly volumes, comparisons. */
export function BarSeriesChart({
  data,
  xKey,
  series,
  height = 280,
  yFormatter,
  valueFormatter,
  signColors = false,
  zeroLine = false,
}: BarSeriesChartProps) {
  const mounted = useMounted();
  if (!mounted) return <ChartSkeleton height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 6, right: 10, bottom: 0, left: -6 }}
        barCategoryGap="16%"
      >
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey={xKey}
          {...axisProps}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis {...axisProps} width={54} tickFormatter={yFormatter} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={<ChartTooltip formatter={valueFormatter} />}
        />
        {zeroLine && (
          <ReferenceLine y={0} stroke={CHART.axisLine} strokeWidth={1} />
        )}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={34}
            isAnimationActive={false}
          >
            {signColors &&
              data.map((row, i) => (
                <Cell
                  key={i}
                  fill={
                    Number(row[s.key]) < 0 ? CHART.red : CHART.emerald
                  }
                />
              ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

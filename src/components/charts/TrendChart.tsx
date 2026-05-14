"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisProps, gridProps } from "@/lib/chartTheme";
import { useMounted } from "@/lib/useMounted";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartTooltip } from "./ChartTooltip";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

interface TrendChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: ChartSeries[];
  height?: number;
  /** Render filled areas instead of plain lines. */
  area?: boolean;
  yFormatter?: (n: number) => string;
  valueFormatter?: (n: number, name: string) => string;
}

/** Multi-series line / area trend — the workhorse 5-year-trend chart. */
export function TrendChart({
  data,
  xKey,
  series,
  height = 280,
  area = false,
  yFormatter,
  valueFormatter,
}: TrendChartProps) {
  const id = useId().replace(/:/g, "");
  const mounted = useMounted();
  const Chart = area ? AreaChart : LineChart;
  if (!mounted) return <ChartSkeleton height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -6 }}>
        {area && (
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`grad-${id}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.26} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
        )}
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey={xKey}
          {...axisProps}
          interval="preserveStartEnd"
          minTickGap={18}
        />
        <YAxis {...axisProps} width={54} tickFormatter={yFormatter} />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.16)", strokeWidth: 1 }}
          content={<ChartTooltip formatter={valueFormatter} />}
        />
        {series.map((s) =>
          area ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${id}-${s.key})`}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}

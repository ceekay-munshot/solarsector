"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useMounted } from "@/lib/useMounted";
import { ChartSkeleton } from "./ChartSkeleton";

interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
}

/** Tiny axis-less trend used inside KPI cards. */
export function Sparkline({ data, color, height = 38 }: SparklineProps) {
  const id = useId().replace(/:/g, "");
  const mounted = useMounted();
  const chartData = data.map((v, i) => ({ i, v }));
  if (!mounted) return <ChartSkeleton height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 3, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#spark-${id})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

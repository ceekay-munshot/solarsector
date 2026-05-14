import clsx from "clsx";
import { AlertTriangle, Info, TrendingDown, TrendingUp } from "lucide-react";
import { Panel } from "@/components/primitives/Panel";
import { tone } from "@/lib/tone";
import type { AccentTone, InsightItem, InsightTone } from "@/lib/types";

const TONE_MAP: Record<InsightTone, AccentTone> = {
  positive: "emerald",
  negative: "red",
  watch: "amber",
  neutral: "blue",
};

const ICON_MAP = {
  positive: TrendingUp,
  negative: TrendingDown,
  watch: AlertTriangle,
  neutral: Info,
} as const;

/** A single "what changed this quarter" insight. */
export function InsightCard({ item }: { item: InsightItem }) {
  const t = tone(TONE_MAP[item.tone]);
  const Icon = ICON_MAP[item.tone];
  return (
    <Panel hover className="flex h-full flex-col gap-2.5 p-4">
      <div className="flex items-center justify-between gap-2">
        <span
          className={clsx(
            "inline-flex h-7 w-7 items-center justify-center rounded-lg",
            t.fill,
            t.text,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        {item.metric && (
          <span className={clsx("num text-sm font-semibold", t.text)}>
            {item.metric}
          </span>
        )}
      </div>
      <h4 className="text-sm leading-snug font-semibold text-ink">
        {item.title}
      </h4>
      <p className="text-xs leading-relaxed text-muted">{item.detail}</p>
    </Panel>
  );
}

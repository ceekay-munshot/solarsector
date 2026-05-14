/**
 * Accent-tone → Tailwind class mapping. Centralised so KPI cards, insight
 * cards, badges and chart accents all pull from one palette.
 */
import type { AccentTone } from "@/lib/types";

export interface ToneClasses {
  /** Foreground text/icon colour. */
  text: string;
  /** Subtle translucent fill for chips/icon tiles. */
  fill: string;
  /** Hairline border. */
  border: string;
  /** Solid status dot. */
  dot: string;
  /** Card top-glow gradient stop. */
  glow: string;
  /** Raw hex (for inline styles / charts). */
  hex: string;
}

export const TONES: Record<AccentTone, ToneClasses> = {
  amber: {
    text: "text-amber",
    fill: "bg-amber/10",
    border: "border-amber/30",
    dot: "bg-amber",
    glow: "from-amber/25",
    hex: "#f5a524",
  },
  blue: {
    text: "text-blue",
    fill: "bg-blue/10",
    border: "border-blue/30",
    dot: "bg-blue",
    glow: "from-blue/25",
    hex: "#38bdf8",
  },
  emerald: {
    text: "text-emerald",
    fill: "bg-emerald/10",
    border: "border-emerald/30",
    dot: "bg-emerald",
    glow: "from-emerald/25",
    hex: "#34d399",
  },
  violet: {
    text: "text-violet",
    fill: "bg-violet/10",
    border: "border-violet/30",
    dot: "bg-violet",
    glow: "from-violet/25",
    hex: "#a78bfa",
  },
  orange: {
    text: "text-orange",
    fill: "bg-orange/10",
    border: "border-orange/30",
    dot: "bg-orange",
    glow: "from-orange/25",
    hex: "#fb923c",
  },
  red: {
    text: "text-red",
    fill: "bg-red/10",
    border: "border-red/30",
    dot: "bg-red",
    glow: "from-red/25",
    hex: "#f87171",
  },
  neutral: {
    text: "text-muted",
    fill: "bg-white/6",
    border: "border-white/12",
    dot: "bg-slate-400",
    glow: "from-white/10",
    hex: "#7986ad",
  },
};

export function tone(t: AccentTone): ToneClasses {
  return TONES[t];
}

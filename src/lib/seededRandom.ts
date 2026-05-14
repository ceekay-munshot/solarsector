/**
 * Deterministic pseudo-random helpers for mock-data generation.
 *
 * Mock series are generated at module-load time. Generation MUST be
 * deterministic (no `Math.random()`, no `Date.now()`) so the server and the
 * client compute byte-identical values and React hydration never mismatches.
 */

/** mulberry32 — small, fast, deterministic PRNG. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function roundTo(n: number, step = 1): number {
  return Math.round(n / step) * step;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-10 * (x - 0.5)));

export interface GrowthOpts {
  seed: number;
  /** Number of points. */
  n: number;
  /** Approximate first value. */
  start: number;
  /** Approximate last value. */
  end: number;
  /** Noise amplitude as a fraction of the value (default 0.08). */
  noise?: number;
  /** Seasonal multipliers cycled across points (e.g. 4 entries for quarters). */
  seasonal?: number[];
  /** Trend shape between start and end. */
  curve?: "linear" | "scurve" | "accel" | "decel";
  /** Round every value to this step (default 1). */
  round?: number;
  /** Lower clamp (default 0). */
  min?: number;
}

/**
 * Build a realistic-looking trend series that grows from `start` to `end`
 * with optional seasonality and bounded noise.
 */
export function growthSeries(opts: GrowthOpts): number[] {
  const {
    seed,
    n,
    start,
    end,
    noise = 0.08,
    seasonal,
    curve = "linear",
    round = 1,
    min = 0,
  } = opts;
  const rng = makeRng(seed);
  const sig0 = sigmoid(0);
  const sig1 = sigmoid(1);
  const out: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1);
    let shaped: number;
    switch (curve) {
      case "scurve":
        shaped = (sigmoid(t) - sig0) / (sig1 - sig0);
        break;
      case "accel":
        shaped = t * t;
        break;
      case "decel":
        shaped = 1 - (1 - t) * (1 - t);
        break;
      default:
        shaped = t;
    }
    let v = start + (end - start) * shaped;
    if (seasonal && seasonal.length > 0) v *= seasonal[i % seasonal.length];
    v *= 1 + (rng() - 0.5) * 2 * noise;
    out.push(roundTo(Math.max(min, v), round));
  }
  return out;
}

/** Element-wise sum across any number of equal-ish length series. */
export function sumSeries(...series: number[][]): number[] {
  const n = Math.max(...series.map((s) => s.length));
  return Array.from({ length: n }, (_, i) =>
    series.reduce((acc, s) => acc + (s[i] ?? 0), 0),
  );
}

/** Percentage change between two values, guarding divide-by-zero. */
export function pctChange(curr: number, prev: number): number {
  if (!prev) return 0;
  return roundTo(((curr - prev) / prev) * 100, 0.1);
}

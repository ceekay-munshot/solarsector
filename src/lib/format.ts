/** Display formatters. Keep all number-to-string logic here, not in components. */

const NF = new Intl.NumberFormat("en-IN");

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Capacity in MW with thousands separators: 12450 → "12,450 MW". */
export function formatMW(mw: number): string {
  return `${NF.format(Math.round(mw))} MW`;
}

/** Capacity that auto-switches to GW above 10 GW: 18500 → "18.5 GW". */
export function formatCapacity(mw: number): string {
  if (Math.abs(mw) >= 10_000) return `${formatNumber(mw / 1000, 1)} GW`;
  return formatMW(mw);
}

export function formatGW(gw: number, decimals = 1): string {
  return `${formatNumber(gw, decimals)} GW`;
}

/** Energy in billion units: 142.4 → "142.4 BU". */
export function formatBU(bu: number): string {
  return `${formatNumber(bu, 1)} BU`;
}

/** Tariff in Rs/kWh: 2.536 → "₹2.54". */
export function formatTariff(rs: number): string {
  return `₹${formatNumber(rs, 2)}`;
}

export function formatPct(n: number, decimals = 1): string {
  return `${formatNumber(n, decimals)}%`;
}

/** Signed percentage for deltas: 4.2 → "+4.2%", -1.3 → "-1.3%". */
export function formatSignedPct(n: number, decimals = 1): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${formatNumber(n, decimals)}%`;
}

/** Compact large counts: 1450 → "1.45K", 2_300_000 → "2.3M". */
export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${formatNumber(n / 1_000_000, 1)}M`;
  if (Math.abs(n) >= 1_000) return `${formatNumber(n / 1_000, 1)}K`;
  return formatNumber(n);
}

/** Relative "freshness" string from an ISO timestamp. */
export function formatFreshness(iso?: string): string {
  if (!iso) return "not yet fetched";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Absolute timestamp for tooltips: "14 May 2026, 07:31". */
export function formatTimestamp(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

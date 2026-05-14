#!/usr/bin/env node
/**
 * Live data ingestion + source-health probe.
 *
 * Plain Node ESM (no dependencies) so the GitHub Action stays trivial.
 * Writes two snapshots consumed by the dashboard:
 *   - src/data/live/seci-tenders.json   (SECI tender records, or mock-fallback marker)
 *   - src/data/live/source-health.json  (probe results for every tracked source)
 *
 * Design intent (milestone 1): get SECI live if at all possible, make source
 * health visible, and fail *gracefully* — never throw, always write an honest
 * snapshot so the UI can badge Live / Fallback / Pending correctly.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LIVE_DIR = join(ROOT, "src", "data", "live");
const TIMEOUT_MS = 15_000;
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/124.0 Safari/537.36 SolarSectorResearchBot/1.0";

/* ----------------------------------------------------------------------- */
/* Fetch helper — never throws.                                             */
/* ----------------------------------------------------------------------- */
async function safeFetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
      },
    });
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      body,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: "",
      latencyMs: Date.now() - start,
      error: err && err.name === "AbortError" ? "Request timed out" : String(err?.message ?? err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ----------------------------------------------------------------------- */
/* Period + classification helpers.                                        */
/* ----------------------------------------------------------------------- */
/** Map a Date to an Indian fiscal-year period string, e.g. "Q3 FY26". */
function toPeriod(d) {
  const m = d.getMonth(); // 0 = Jan
  const y = d.getFullYear();
  const fyYear = m >= 3 ? y + 1 : y;
  const q = m >= 3 && m <= 5 ? 1 : m >= 6 && m <= 8 ? 2 : m >= 9 && m <= 11 ? 3 : 4;
  return `Q${q} FY${String(fyYear).slice(-2)}`;
}

function guessTech(text) {
  const t = text.toLowerCase();
  if (t.includes("fdre") || (t.includes("firm") && t.includes("dispatch"))) return "FDRE";
  if (t.includes("round the clock") || t.includes("round-the-clock") || /\brtc\b/.test(t)) return "RTC";
  if (t.includes("hybrid")) return "Hybrid";
  if (t.includes("bess") || t.includes("battery") || t.includes("storage")) return "BESS";
  if (t.includes("wind")) return "Wind";
  return "Solar";
}

function guessStage(text, fallback) {
  const t = text.toLowerCase();
  if (t.includes("awarded") || t.includes("loa") || t.includes("result")) return "Awarded";
  if (t.includes("e-reverse auction") || t.includes("bids opened") || t.includes("bid submission")) return "Bids Submitted";
  if (t.includes("rfs") || t.includes("invitation") || t.includes("issued")) return "Announced";
  return fallback;
}

/**
 * Deliberately basic SECI parser (milestone 1 does not perfect this). Pulls
 * table rows, keeps any that mention an "<n> MW" capacity, and classifies
 * them heuristically. If SECI ships a stable API/feed later, only this
 * function changes.
 */
function parseSeciTenders(html, defaultStage) {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const records = [];
  let idx = 0;
  for (const row of rows) {
    const text = row
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 12) continue;
    const mw = text.match(/([\d,]+(?:\.\d+)?)\s*MW\b/i);
    if (!mw) continue;
    const capacityMW = Number(mw[1].replace(/,/g, ""));
    if (!capacityMW || Number.isNaN(capacityMW)) continue;
    const dateMatch = text.match(/(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/);
    const parsedDate = dateMatch ? new Date(dateMatch[1].replace(/[-.]/g, "/")) : new Date();
    const when = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    records.push({
      id: `seci-live-${idx++}`,
      title: text.slice(0, 96),
      agency: "SECI",
      tech: guessTech(text),
      capacityMW,
      stage: guessStage(text, defaultStage),
      date: dateMatch ? dateMatch[1] : when.toISOString().slice(0, 10),
      period: toPeriod(when),
    });
  }
  return records;
}

/* ----------------------------------------------------------------------- */
/* SECI ingestion.                                                          */
/* ----------------------------------------------------------------------- */
async function ingestSeci(now) {
  const tendersUrl = "https://www.seci.co.in/tenders";
  const resultsUrl = "https://www.seci.co.in/tenders/results";
  const [a, b] = await Promise.all([safeFetch(tendersUrl), safeFetch(resultsUrl)]);

  let records = [];
  if (a.ok) records = records.concat(parseSeciTenders(a.body, "Announced"));
  if (b.ok) records = records.concat(parseSeciTenders(b.body, "Awarded"));

  // De-dupe on title + capacity.
  const seen = new Set();
  records = records.filter((r) => {
    const key = `${r.title}|${r.capacityMW}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (records.length > 0) {
    return {
      meta: {
        status: "live",
        sourceName: "SECI Tenders (live)",
        sourceUrl: tendersUrl,
        lastChecked: now,
        note: `Parsed ${records.length} tender rows from SECI on the last run.`,
      },
      records,
    };
  }

  const httpNote =
    !a.ok && a.status
      ? `tenders page returned HTTP ${a.status}`
      : a.error
        ? `tenders page error: ${a.error}`
        : "tenders page returned no parseable rows";
  return {
    meta: {
      status: "fallback",
      sourceName: "SECI Tenders (live)",
      sourceUrl: tendersUrl,
      lastChecked: now,
      note: `Live SECI fetch unsuccessful — ${httpNote}. Dashboard is showing the mock tender book.`,
    },
    records: [],
  };
}

/* ----------------------------------------------------------------------- */
/* Source-health probes.                                                    */
/* ----------------------------------------------------------------------- */
const PROBE_TARGETS = [
  { id: "seci-tenders", name: "SECI — Tenders", url: "https://www.seci.co.in/tenders" },
  { id: "seci-results", name: "SECI — Tender Results", url: "https://www.seci.co.in/tenders/results" },
  { id: "cerc-orders", name: "CERC — Recent Orders", url: "https://cercind.gov.in/recent_orders.html" },
  { id: "cerc-rops", name: "CERC — Recent ROPs", url: "https://cercind.gov.in/recent_rops.html" },
  { id: "npp-reports", name: "NPP — Published Reports", url: "https://npp.gov.in/publishedReports" },
  {
    id: "mnre-almm",
    name: "MNRE — ALMM",
    url: "https://mnre.gov.in/en/approved-list-of-models-and-manufacturers-almm/",
  },
  { id: "dcr-portal", name: "DCR Verification Portal (NISE)", url: "https://solardcrportal.nise.res.in/" },
];

async function probeSources(now) {
  return Promise.all(
    PROBE_TARGETS.map(async (target) => {
      const res = await safeFetch(target.url);
      let status;
      if (res.ok) status = "live";
      else if (res.status > 0) status = "fallback"; // server responded, not usable
      else status = "probe_failed"; // network error / timeout
      return {
        id: target.id,
        name: target.name,
        url: target.url,
        status,
        httpStatus: res.status || undefined,
        latencyMs: res.latencyMs,
        ok: res.ok,
        error: res.error ?? (res.ok ? undefined : `HTTP ${res.status}`),
        checkedAt: now,
      };
    }),
  );
}

/* ----------------------------------------------------------------------- */
/* Main.                                                                    */
/* ----------------------------------------------------------------------- */
async function main() {
  const now = new Date().toISOString();
  mkdirSync(LIVE_DIR, { recursive: true });

  console.log("solarsector › ingestion run", now);

  const seci = await ingestSeci(now);
  writeFileSync(
    join(LIVE_DIR, "seci-tenders.json"),
    JSON.stringify(seci, null, 2) + "\n",
  );
  console.log(
    `  SECI tenders     : ${seci.meta.status.toUpperCase()} — ${seci.records.length} records`,
  );

  const probes = await probeSources(now);
  const liveCount = probes.filter((p) => p.status === "live").length;
  const health = {
    meta: {
      status: liveCount > 0 ? "live" : "fallback",
      sourceName: "Source health probes",
      lastChecked: now,
      note: `${liveCount}/${probes.length} tracked sources reachable on the last run.`,
    },
    generatedAt: now,
    probes,
  };
  writeFileSync(
    join(LIVE_DIR, "source-health.json"),
    JSON.stringify(health, null, 2) + "\n",
  );

  for (const p of probes) {
    const code = p.httpStatus ? `HTTP ${p.httpStatus}` : (p.error ?? "no response");
    console.log(
      `  ${p.id.padEnd(16)} : ${p.status.toUpperCase().padEnd(13)} ${code} (${p.latencyMs}ms)`,
    );
  }
  console.log(`  source health    : ${liveCount}/${probes.length} reachable`);
  console.log("solarsector › snapshots written to src/data/live/");
}

main().catch((err) => {
  // Even a catastrophic failure should not break CI — log and exit clean.
  console.error("ingestion run failed:", err);
  process.exitCode = 0;
});

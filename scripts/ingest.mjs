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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

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

/** Binary variant of safeFetch — used for the NPP .xls downloads. */
async function safeFetchBuffer(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "application/vnd.ms-excel, application/octet-stream, */*",
      },
    });
    const buffer = res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    return {
      ok: res.ok,
      status: res.status,
      buffer,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      buffer: null,
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

const SECI_TECHS = ["Solar", "FDRE", "Wind", "BESS", "Hybrid", "RTC"];

/**
 * Build quarterly award + tech-mix aggregates from awarded SECI tender rows.
 * Returns null when there's nothing usable — the resolver then falls back to
 * mock for those parts. Period mapping uses the date in each tender title,
 * which is typically the *issue* date rather than the award date — the meta
 * note flags this so the badge story stays honest.
 */
function buildSeciAggregates(awardedRecords) {
  const usable = awardedRecords.filter(
    (r) => r.period && Number.isFinite(r.capacityMW) && r.capacityMW > 0,
  );
  if (usable.length < 5) return null;

  const byPeriod = new Map();
  for (const r of usable) {
    if (!byPeriod.has(r.period)) byPeriod.set(r.period, []);
    byPeriod.get(r.period).push(r);
  }
  if (byPeriod.size < 2) return null;

  const periods = [...byPeriod.entries()];
  const quarterlyAwards = periods.map(([period, list]) => {
    const [q, fy] = period.split(" ");
    return {
      period,
      fy,
      quarter: q,
      awardedMW: Math.round(list.reduce((acc, r) => acc + r.capacityMW, 0)),
    };
  });

  const mix = periods.map(([period, list]) => {
    const [q, fy] = period.split(" ");
    const slot = {
      period, fy, quarter: q,
      Solar: 0, FDRE: 0, Wind: 0, BESS: 0, Hybrid: 0, RTC: 0,
    };
    for (const r of list) {
      if (SECI_TECHS.includes(r.tech)) slot[r.tech] += r.capacityMW;
    }
    for (const t of SECI_TECHS) slot[t] = Math.round(slot[t]);
    return slot;
  });

  return { quarterlyAwards, mix, awardedRecordCount: usable.length };
}

async function ingestSeci(now) {
  const tendersUrl = "https://www.seci.co.in/tenders";
  const resultsUrl = "https://www.seci.co.in/tenders/results";
  const [a, b] = await Promise.all([safeFetch(tendersUrl), safeFetch(resultsUrl)]);

  const tendersPageRecords = a.ok ? parseSeciTenders(a.body, "Announced") : [];
  const resultsPageRecords = b.ok ? parseSeciTenders(b.body, "Awarded") : [];

  // For aggregates: results-page rows are awarded by definition. The parser's
  // `guessStage` heuristic over-applies the "Announced" tag (anything with
  // "RfS" in the title gets re-tagged), so we override here to trust the
  // source page rather than the keyword search.
  const awardedFromResults = resultsPageRecords.map((r) => ({
    ...r,
    stage: "Awarded",
  }));
  const aggregates = buildSeciAggregates(awardedFromResults);

  // De-dupe on title + capacity, then assign ids over the de-duped set so the
  // two parse passes (tenders + results) can't emit colliding ids. Records
  // keep their per-row stage classification for the tender-book table.
  let records = [...tendersPageRecords, ...resultsPageRecords];
  const seen = new Set();
  records = records
    .filter((r) => {
      const key = `${r.title}|${r.capacityMW}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((r, i) => ({ id: `seci-live-${i}`, ...r }));

  if (records.length > 0) {
    return {
      meta: {
        status: "live",
        sourceName: "SECI Tenders (live)",
        sourceUrl: tendersUrl,
        lastChecked: now,
        note: aggregates
          ? `Parsed ${records.length} tender rows from SECI · ${aggregates.awardedRecordCount} awarded rows aggregated into the award/mix series (period derived from the date in each tender title — typically issue date, not award date).`
          : `Parsed ${records.length} tender rows from SECI on the last run.`,
      },
      records,
      ...(aggregates
        ? {
            aggregates: {
              quarterlyAwards: aggregates.quarterlyAwards,
              mix: aggregates.mix,
            },
          }
        : {}),
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
/* NPP — CEA monthly installed-capacity ingestion.                          */
/* ----------------------------------------------------------------------- */

const NPP_MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];
// Dashboard window starts at FY22 Q1 → Apr 2021. We start one month *earlier*
// (Mar 2021 = end of Q4 FY21) so the resolver has a baseline cumulative reading
// to derive Q1 FY22 commissioning from. Failures (e.g. month not published yet,
// or pre-existing in archive) are silent.
const NPP_WINDOW_START = { year: 2021, month: 3 };

function nppCapacityUrl(year, monthNum) {
  const abbr = NPP_MONTH_ABBR[monthNum - 1];
  const mm = String(monthNum).padStart(2, "0");
  return `https://npp.gov.in/public-reports/cea/monthly/installcap/${year}/${abbr}/capacity1-${year}-${mm}.xls`;
}

/** Map a (calendar year, calendar month) to its Indian-fiscal-year period. */
function nppPeriodFromMonth(year, monthNum) {
  const fyYear = monthNum >= 4 ? year + 1 : year;
  const quarter =
    monthNum >= 4 && monthNum <= 6 ? "Q1"
    : monthNum >= 7 && monthNum <= 9 ? "Q2"
    : monthNum >= 10 && monthNum <= 12 ? "Q3"
    : "Q4";
  const fy = `FY${String(fyYear).slice(-2)}`;
  return { fy, quarter, period: `${quarter} ${fy}` };
}

function nppLastDayOfMonth(year, monthNum) {
  return new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
}

function nppRound2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Parse one CEA "All India Installed Capacity (in MW) of Power Stations" XLS
 * into a single point. Defensive: locates rows/columns by header text rather
 * than fixed addresses, so cosmetic re-orderings of the CEA template don't
 * break it. Returns null when the file isn't a recognisable capacity report.
 */
function parseCapacityXls(buffer, year, monthNum) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return null;
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return null;

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const findCell = (predicate) => {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        if (predicate(row[c])) return { row: r, col: c };
      }
    }
    return null;
  };

  const gtCell = findCell(
    (v) => typeof v === "string" && /grand\s*total/i.test(v),
  );
  const resCell = findCell(
    (v) => typeof v === "string" && v.trim().toUpperCase() === "RES",
  );
  if (!gtCell || !resCell) return null;

  const totalRowMatch = findCell(
    (v) =>
      typeof v === "string" &&
      /total\s+of\s+all\s+india/i.test(v.replace(/\s+/g, " ")),
  );
  if (!totalRowMatch) return null;
  const totalRow = rows[totalRowMatch.row];
  if (!Array.isArray(totalRow)) return null;

  const totalMW = Number(totalRow[gtCell.col]);
  const renewableMW = Number(totalRow[resCell.col]);

  // Sanity-check: any reading outside the plausible Indian-grid range is
  // almost certainly a layout mis-match, not real data.
  if (!Number.isFinite(totalMW) || totalMW < 100_000 || totalMW > 1_500_000) {
    return null;
  }
  if (
    !Number.isFinite(renewableMW) ||
    renewableMW < 10_000 ||
    renewableMW > 700_000
  ) {
    return null;
  }
  // Renewable should be a strict subset of total.
  if (renewableMW >= totalMW) return null;

  // --- Per-source extraction -------------------------------------------
  // Best-effort: if any header is missing or values look wrong we just skip
  // bySource (the cumulative readings still go in). The dashboard's resolver
  // falls back to mock commissioning when bySource is absent.
  const headerCol = (label) => {
    const cell = findCell(
      (v) =>
        typeof v === "string" && v.trim().toLowerCase() === label.toLowerCase(),
    );
    return cell?.col;
  };
  const coalCol = headerCol("Coal");
  const ligniteCol = headerCol("Lignite");
  const gasCol = headerCol("Gas");
  const dieselCol = headerCol("Diesel");
  const hydroCol = headerCol("Hydro");
  const nuclearCol = headerCol("Nuclear");

  let bySource;
  if (
    coalCol != null && ligniteCol != null && gasCol != null &&
    dieselCol != null && hydroCol != null && nuclearCol != null
  ) {
    const coal = Number(totalRow[coalCol]);
    const lignite = Number(totalRow[ligniteCol]);
    const gas = Number(totalRow[gasCol]);
    const diesel = Number(totalRow[dieselCol]);
    const hydroLargeMW = Number(totalRow[hydroCol]);
    const nuclearMW = Number(totalRow[nuclearCol]);

    // RES breakup table — Solar Power, Wind Power, Small Hydro Power live in
    // a small table below the main one. Find their headers, then scan the
    // next few rows for the data row that has finite numbers at those cols.
    const solarHeader = findCell(
      (v) => typeof v === "string" && /^solar\s*power$/i.test(v.trim()),
    );
    const windHeader = findCell(
      (v) => typeof v === "string" && /^wind\s*power$/i.test(v.trim()),
    );
    const smallHydroHeader = findCell(
      (v) => typeof v === "string" && /^small\s*hydro\s*power$/i.test(v.trim()),
    );

    let solarMW = NaN;
    let windMW = NaN;
    let smallHydroMW = 0;
    if (solarHeader && windHeader) {
      const start = Math.max(solarHeader.row, windHeader.row);
      for (let r = start + 1; r < Math.min(start + 6, rows.length); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        const s = Number(row[solarHeader.col]);
        const w = Number(row[windHeader.col]);
        if (Number.isFinite(s) && Number.isFinite(w) && s > 0 && w > 0) {
          solarMW = s;
          windMW = w;
          if (smallHydroHeader) {
            const sh = Number(row[smallHydroHeader.col]);
            if (Number.isFinite(sh) && sh >= 0) smallHydroMW = sh;
          }
          break;
        }
      }
    }

    const allFinite = [
      coal, lignite, gas, diesel, hydroLargeMW, nuclearMW, solarMW, windMW,
    ].every(Number.isFinite);
    // Sanity: solar + wind should account for the bulk of RES but not exceed it.
    const consistent =
      allFinite && solarMW + windMW > 0 && solarMW + windMW <= renewableMW;

    if (consistent) {
      bySource = {
        Solar: nppRound2(solarMW),
        Wind: nppRound2(windMW),
        Hydro: nppRound2(hydroLargeMW + smallHydroMW),
        Thermal: nppRound2(coal + lignite + gas + diesel),
        Nuclear: nppRound2(nuclearMW),
      };
    }
  }

  const { fy, quarter, period } = nppPeriodFromMonth(year, monthNum);
  const asOf = `${year}-${String(monthNum).padStart(2, "0")}-${String(
    nppLastDayOfMonth(year, monthNum),
  ).padStart(2, "0")}`;

  return {
    asOf,
    period,
    fy,
    quarter,
    totalMW: nppRound2(totalMW),
    renewableMW: nppRound2(renewableMW),
    ...(bySource ? { bySource } : {}),
  };
}

async function ingestNppCapacity(now, snapshotPath) {
  const today = new Date(now);
  const endYear = today.getUTCFullYear();
  const endMonth = today.getUTCMonth() + 1; // 1-12 (current calendar month)

  // Build the (year, month) list from window start through the current month.
  const targets = [];
  for (let y = NPP_WINDOW_START.year; y <= endYear; y++) {
    const minM = y === NPP_WINDOW_START.year ? NPP_WINDOW_START.month : 1;
    const maxM = y === endYear ? endMonth : 12;
    for (let m = minM; m <= maxM; m++) targets.push({ y, m });
  }

  const points = [];
  let lastUrl = "";
  for (const { y, m } of targets) {
    const url = nppCapacityUrl(y, m);
    lastUrl = url;
    const res = await safeFetchBuffer(url);
    if (!res.ok || !res.buffer) continue;
    const point = parseCapacityXls(res.buffer, y, m);
    if (point) points.push(point);
  }

  // Safety: if this run produced fewer points than the previously committed
  // snapshot, preserve the previous data (treat as a degraded run, not a
  // regression). Stops a single bad fetch from blowing away real history.
  let preservedPoints = [];
  try {
    if (existsSync(snapshotPath)) {
      const existing = JSON.parse(readFileSync(snapshotPath, "utf8"));
      if (Array.isArray(existing?.points)) preservedPoints = existing.points;
    }
  } catch {
    // ignore — treat as no preserved state
  }

  if (points.length < preservedPoints.length) {
    return {
      meta: {
        status: "fallback",
        sourceName: "CEA Installed Capacity (NPP)",
        sourceUrl: "https://npp.gov.in/publishedReports",
        lastChecked: now,
        note: `Live NPP run produced ${points.length} of ${targets.length} attempted months — keeping previous snapshot (${preservedPoints.length} points). Last URL tried: ${lastUrl}`,
      },
      points: preservedPoints,
    };
  }

  if (points.length === 0) {
    return {
      meta: {
        status: "pending",
        sourceName: "CEA Installed Capacity (NPP)",
        sourceUrl: "https://npp.gov.in/publishedReports",
        lastChecked: now,
        note: `No parseable readings across ${targets.length} attempted months. Last URL tried: ${lastUrl}`,
      },
      points: [],
    };
  }

  return {
    meta: {
      status: "live",
      sourceName: "CEA Installed Capacity (NPP)",
      sourceUrl: "https://npp.gov.in/publishedReports",
      lastChecked: now,
      note: `Parsed ${points.length} of ${targets.length} monthly installed-capacity readings from NPP/CEA.`,
    },
    points,
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

  const nppCapacityPath = join(LIVE_DIR, "npp-installed-capacity.json");
  const nppCapacity = await ingestNppCapacity(now, nppCapacityPath);
  writeFileSync(nppCapacityPath, JSON.stringify(nppCapacity, null, 2) + "\n");
  console.log(
    `  NPP capacity     : ${nppCapacity.meta.status.toUpperCase()} — ${nppCapacity.points.length} monthly points`,
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

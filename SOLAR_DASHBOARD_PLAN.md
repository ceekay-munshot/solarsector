# India Solar & Power — Command Center · Dashboard Plan

> **Status: Milestone 1 — mixed-data prototype.**
> This document explains how the prototype is wired, which data is live vs
> mock, and the roadmap to replace mock data with live ingestion tab-by-tab.

---

## 1. What this prototype is

This is a **mixed-data prototype** of an institutional research dashboard for
India's solar & power sector. It is presentation-grade and boardroom-ready, but
the data behind it is intentionally a mix:

- **Live data** is fetched wherever it can be retrieved safely through a script
  / GitHub Action — today that means **SECI tenders** and the **source-health
  probes** for every tracked source.
- **Mock data** is used everywhere a live ingestion parser is not built yet. It
  is curated, internally consistent, and shaped to match the eventual live
  schema so the UI never has to be redesigned when a feed goes live.
- **Mock fallback** is used when a live fetch is *attempted and fails* — the
  visual is badged `Live failed · Mock fallback` rather than silently degrading.

### The honesty rule

**Live and mock data are never silently mixed.** Every card, chart and table
renders a data-status badge:

| Badge | Meaning |
| --- | --- |
| `Live` | Fetched from the upstream source by the latest ingestion run. |
| `Mock` | Curated mock dataset — live ingestion for this feed is not built yet. |
| `Live failed · Mock fallback` | A live fetch was attempted and failed; mock data is shown until the source recovers. |
| `Ingestion pending` | Ingestion for this source has not been wired up yet. |

Mock data is centralised under `src/data/mock/` and **never** hardcoded inside
components. Live snapshots are written to `src/data/live/` by the ingestion
script and are kept separate from the mock datasets. The resolver in
`src/data/datasets.ts` is the single place that decides live-vs-mock and
attaches the correct badge.

### Current run status

As of the latest ingestion run, **all seven tracked sources return HTTP 403 to
scripted requests** (they sit behind bot/WAF protection or filter datacenter
egress). The dashboard therefore shows:

- **Tenders** → `Live failed · Mock fallback` (SECI was attempted, blocked).
- **Everything else** → `Mock` (`Ingestion pending` for feeds not yet wired).
- **Sources page** → every probe shows its real HTTP status and latency.

This is the system behaving exactly as designed — when the GitHub Action runs
from infrastructure that *can* reach SECI, the Tenders tab flips to `Live`
automatically with no code change.

---

## 2. The end state

The final dashboard replaces mock data with live ingestion **tab-by-tab**. Each
feed graduates through: `Ingestion pending` → `Mock` → (parser built) →
`Live` / `Live failed · Mock fallback`. Because the mock datasets already match
the typed schema the live parser will emit, going live is a data-layer change
only — **no UI redesign**.

---

## 3. Page-by-page source mapping

| Page | What it shows | Today | Target live source(s) |
| --- | --- | --- | --- |
| **Overview** | Executive cockpit — KPIs, trends, insight strip | Mixed (mirrors every tab) | Aggregates all sources below |
| **DCR** | Quarterly DCR module & cell production, player-wise | Mock | MNRE ALMM (List-I/II) + DCR Verification Portal (NISE) — see §5 risk |
| **Tenders** | Quarterly awards, tender mix, developer league, tender book | **Live-first (SECI)**, mock fallback for history | SECI Tenders + SECI Tender Results |
| **Tariffs** | Discovered tariff trend, comparison, contracts, bidders | Mock | CERC Recent Orders + SECI Tender Results |
| **Capacity** | Quarterly commissioning by source, cumulative base | Mock | NPP Published Reports + CEA |
| **Demand** | Monthly demand, quarterly/yearly growth, seasonality | Mock | NPP / CEA / POSOCO power-supply position |
| **IPP** | Developer leaderboards, pipelines, technology mix | Mock | Company disclosures + SECI/agency award data |
| **Sources** | Source registry + live probe health | **Live** (probe results) | n/a — this *is* the provenance layer |

---

## 4. Suggested live-ingestion order

Ordered by value-to-effort. This is also encoded as `ingestionPriority` on each
source in `src/data/sources.ts` and rendered on the Sources tab.

1. **SECI Tenders + Tender Results** — highest-value feed; structure already
   attempted in `scripts/ingest.mjs`. Unlocks the Tenders tab and feeds
   Overview. *Effort: low–medium once egress to SECI is available.*
2. **NPP Published Reports** — installed capacity by source + power-supply
   position. Unlocks **Capacity** and **Demand** from one source. *Effort: medium.*
3. **CERC Recent Orders** — tariff adoption / PPA orders → awarded-bidder
   tariffs on the **Tariffs** tab. *Effort: medium (PDF/order parsing).*
4. **MNRE ALMM** — approved module (List-I) & cell (List-II) manufacturers →
   the DCR universe and nameplate capacity. *Effort: medium.*
5. **DCR Verification Portal (NISE)** — needed to validate **player-wise** DCR
   output. *Effort: high — see §5.*
6. **CERC Recent ROPs** — supporting context around tariff/regulatory orders.
   *Effort: low, low priority.*

---

## 5. DCR player-wise production — feasibility risk

**This is the single biggest data risk in the plan and is flagged explicitly.**

- DCR *quarterly industry totals* are reasonably approximated from MNRE ALMM
  capacity additions plus production-linked disclosures — **feasible, medium
  effort.**
- DCR **player-wise quarterly production** is **not published in any single
  public feed.** No source gives "Waaree produced X MW of DCR modules in
  Q3 FY26." It would have to be triangulated from:
  - ALMM List-I / List-II enrolled capacity per manufacturer (capacity, not
    output);
  - the DCR Verification Portal (verification events, not clean quarterly MW);
  - company filings / investor decks (annual, inconsistent cadence);
  - channel checks and trade data.
- **Consequence:** the player-wise DCR module and cell tables are **mock** and
  are badged as such. When ingestion is built, expect player-wise DCR to remain
  a **modelled estimate** with a wider confidence band than the industry total
  — it should keep a distinct badge/caveat even when "live."
- **Recommendation:** ship industry totals as live first; treat player-wise DCR
  as a modelled layer, validated against ALMM capacity and any company
  disclosures, and clearly labelled as an estimate.

---

## 6. Future GitHub Actions ingestion approach

The ingestion pattern is already in place and deliberately simple:

- **`scripts/ingest.mjs`** — plain Node ESM, **zero npm dependencies**. It
  attempts the SECI fetch + parse, probes every tracked source for health, and
  writes two snapshots to `src/data/live/`. It **never throws** — a failed
  fetch produces an honest `fallback` snapshot, not a broken build.
- **`.github/workflows/ingest-data.yml`** — runs the script on a **daily
  schedule** and on **manual dispatch**, then commits the updated snapshots
  back to the repo if they changed. No install step is needed.
- **The dashboard reads committed snapshots**, so a data refresh is just a
  commit — the site rebuilds with fresh data and no runtime fetch.

### How it scales as feeds go live

1. Add a parser function per source inside `scripts/ingest.mjs` (or split into
   `scripts/sources/<name>.mjs` once there are several).
2. Each parser writes its own snapshot to `src/data/live/<source>.json` using
   the **same typed shape** as the matching mock dataset.
3. Extend `src/data/datasets.ts` to resolve that snapshot via the existing
   `resolveDataset` helper — live when fresh, mock fallback when not.
4. The UI changes **nothing** — it already reads resolved `Dataset<T>` values
   and badges them automatically.
5. If any parser needs HTML/PDF libraries, add them as dev dependencies and add
   an `npm ci` step to the workflow — until then it stays dependency-free.

### Operational notes

- Schedule cadence can move to hourly for SECI once it is live; capacity/demand
  feeds are monthly and only need a daily (or even weekly) run.
- Consider a separate workflow per source group once cadences diverge.
- Probe latency and HTTP status are already captured per run and surfaced on
  the Sources tab, so feed degradation is visible without digging into logs.

---

## 7. Project structure

```
src/
  app/                  8 routes — Overview, DCR, Tenders, Tariffs,
                        Capacity, Demand, IPP, Sources
  components/
    badges/             Live/Mock/Fallback, freshness, source badges
    cards/              KPI, chart, insight, stat, source-health cards
    charts/             trend, mix, bar, donut, sparkline (Recharts)
    filters/            global filter context + filter bar
    primitives/         panel, headers, legend, tags, delta pill
    shell/              sidebar, topbar, app shell
    tables/             data / player / ranking tables
  data/
    mock/               centralised mock datasets (one file per domain)
    live/               live snapshots written by the ingestion script
    datasets.ts         the live-vs-mock resolver — single source of truth
    sources.ts          source registry + merged probe health
    overview.ts         derived overview KPIs + editorial insights
    periods.ts          canonical FY22–FY26 period definitions
  lib/                  types, formatters, data-status config, theme
scripts/
  ingest.mjs            zero-dependency live ingestion + source probes
.github/workflows/
  ingest-data.yml       scheduled + manual ingestion
```

# India Solar & Power — Command Center

A premium, presentation-grade research dashboard tracking India's solar & power
sector for institutional clients — DCR manufacturing, tenders, tariffs,
capacity commissioning, power demand and IPP pipelines.

**Milestone 1 — mixed-data prototype.** Live data is fetched where reachable
(SECI tenders + source-health probes); clearly-badged mock data is used where
live ingestion is not built yet. Every card, chart and table renders a
`Live` / `Mock` / `Live failed · Mock fallback` / `Ingestion pending` badge —
live and mock data are never silently mixed.

See **[SOLAR_DASHBOARD_PLAN.md](./SOLAR_DASHBOARD_PLAN.md)** for the data
strategy, page-by-page source mapping, ingestion roadmap and the DCR
player-wise feasibility risk.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** — "Solar Command Center" theme
- **Recharts** — trend, mix, bar, donut and sparkline charts

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run ingest` | Run live ingestion + source-health probes, write `src/data/live/` snapshots |

## Data ingestion

`scripts/ingest.mjs` is a zero-dependency Node script that attempts the SECI
live fetch, probes every tracked source for health, and writes JSON snapshots
to `src/data/live/`. `.github/workflows/ingest-data.yml` runs it on a daily
schedule (and on demand) and commits refreshed snapshots. The dashboard reads
the committed snapshots — a data refresh is just a commit.

## Routes

`Overview` · `DCR` · `Tenders` · `Tariffs` · `Capacity` · `Demand` · `IPP` · `Sources`

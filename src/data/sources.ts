/**
 * Source registry. Static metadata (what each source is, how it will be used,
 * which pages depend on it, ingestion priority) merged with the live probe
 * results from the latest ingestion run.
 */
import healthRaw from "@/data/live/source-health.json";
import type {
  SourceCategory,
  SourceHealthSnapshot,
  SourceRegistryEntry,
} from "@/lib/types";

const health = healthRaw as unknown as SourceHealthSnapshot;

interface StaticSource {
  id: string;
  name: string;
  category: SourceCategory;
  url: string;
  plannedUse: string;
  pages: string[];
  ingestionPriority: number;
}

/** The probe `id`s here must match the ids emitted by scripts/ingest.mjs. */
const STATIC_SOURCES: StaticSource[] = [
  {
    id: "seci-tenders",
    name: "SECI — Tenders",
    category: "Tenders",
    url: "https://www.seci.co.in/tenders",
    plannedUse:
      "Live tender book — issued tenders, capacity, technology, agency, status.",
    pages: ["Tenders", "Overview"],
    ingestionPriority: 1,
  },
  {
    id: "seci-results",
    name: "SECI — Tender Results",
    category: "Tenders",
    url: "https://www.seci.co.in/tenders/results",
    plannedUse:
      "Awarded capacity, winning developers and discovered tariffs per tender.",
    pages: ["Tenders", "Tariffs", "Overview"],
    ingestionPriority: 1,
  },
  {
    id: "cerc-orders",
    name: "CERC — Recent Orders",
    category: "Tariffs",
    url: "https://cercind.gov.in/recent_orders.html",
    plannedUse:
      "Tariff adoption / PPA orders — feeds the awarded-bidder tariff table.",
    pages: ["Tariffs"],
    ingestionPriority: 2,
  },
  {
    id: "cerc-rops",
    name: "CERC — Recent ROPs",
    category: "Tariffs",
    url: "https://cercind.gov.in/recent_rops.html",
    plannedUse: "Records of Proceedings — context around tariff / regulatory orders.",
    pages: ["Tariffs"],
    ingestionPriority: 3,
  },
  {
    id: "npp-reports",
    name: "NPP — Published Reports",
    category: "Capacity",
    url: "https://npp.gov.in/publishedReports",
    plannedUse:
      "Installed capacity by source and power-supply position — Capacity & Demand tabs.",
    pages: ["Capacity", "Demand"],
    ingestionPriority: 2,
  },
  {
    id: "mnre-almm",
    name: "MNRE — ALMM",
    category: "Manufacturing",
    url: "https://mnre.gov.in/en/approved-list-of-models-and-manufacturers-almm/",
    plannedUse:
      "Approved module (List-I) & cell (List-II) manufacturers — DCR universe and capacity.",
    pages: ["DCR"],
    ingestionPriority: 4,
  },
  {
    id: "dcr-portal",
    name: "DCR Verification Portal (NISE)",
    category: "DCR",
    url: "https://solardcrportal.nise.res.in/",
    plannedUse:
      "DCR cell/module verification data — required to validate player-wise DCR output.",
    pages: ["DCR"],
    ingestionPriority: 5,
  },
];

/** Full registry: static metadata + latest probe status. */
export const sourceRegistry: SourceRegistryEntry[] = STATIC_SOURCES.map((s) => {
  const probe = health.probes.find((p) => p.id === s.id);
  return {
    ...s,
    status: probe?.status ?? "pending",
    lastChecked: probe?.checkedAt,
    httpStatus: probe?.httpStatus,
    latencyMs: probe?.latencyMs,
    errorMessage: probe?.error,
  };
}).sort((a, b) => a.ingestionPriority - b.ingestionPriority);

export const sourceHealthMeta = health.meta;
export const sourceHealthGeneratedAt = health.generatedAt;

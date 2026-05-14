/**
 * Mock dataset — solar / power tenders.
 *
 * Quarterly awarded-capacity series, technology mix and player league table
 * are synthetic FY22–FY26 data. The `records` list is a representative mock
 * tender book; at runtime it is replaced by the live SECI snapshot when the
 * ingestion run succeeds (see resolveTenderData + scripts/ingest.mjs).
 */
import { QUARTER_KEYS } from "@/data/periods";
import type {
  Dataset,
  TenderAwardPoint,
  TenderData,
  TenderMixPoint,
  TenderPlayerRow,
  TenderRecord,
} from "@/lib/types";
import { growthSeries } from "@/lib/seededRandom";

const n = QUARTER_KEYS.length;
// Fiscal-year-end award push — Q4 consistently heavier than Q1.
const seasonal = [0.9, 0.98, 1.05, 1.13];

const techSeries = {
  Solar: growthSeries({ seed: 301, n, start: 4000, end: 5800, curve: "scurve", noise: 0.16, seasonal, round: 10 }),
  FDRE: growthSeries({ seed: 302, n, start: 0, end: 3800, curve: "accel", noise: 0.24, seasonal, round: 10 }),
  Wind: growthSeries({ seed: 303, n, start: 780, end: 2400, curve: "scurve", noise: 0.2, seasonal, round: 10 }),
  BESS: growthSeries({ seed: 304, n, start: 0, end: 1850, curve: "accel", noise: 0.26, seasonal, round: 10 }),
  Hybrid: growthSeries({ seed: 305, n, start: 300, end: 2100, curve: "scurve", noise: 0.2, seasonal, round: 10 }),
  RTC: growthSeries({ seed: 306, n, start: 200, end: 1100, curve: "scurve", noise: 0.24, seasonal, round: 10 }),
};

const mix: TenderMixPoint[] = QUARTER_KEYS.map((q, i) => ({
  period: q.period,
  fy: q.fy,
  quarter: q.quarter,
  Solar: techSeries.Solar[i],
  FDRE: techSeries.FDRE[i],
  Wind: techSeries.Wind[i],
  BESS: techSeries.BESS[i],
  Hybrid: techSeries.Hybrid[i],
  RTC: techSeries.RTC[i],
}));

const quarterlyAwards: TenderAwardPoint[] = mix.map((m) => ({
  period: m.period,
  fy: m.fy,
  quarter: m.quarter,
  awardedMW: m.Solar + m.FDRE + m.Wind + m.BESS + m.Hybrid + m.RTC,
}));

const players: TenderPlayerRow[] = [
  { player: "Adani Green Energy", awardedMW: 14200, tenderCount: 21, avgTariff: 2.71 },
  { player: "ReNew", awardedMW: 11800, tenderCount: 19, avgTariff: 2.78 },
  { player: "NTPC Green Energy", awardedMW: 9300, tenderCount: 14, avgTariff: 2.64 },
  { player: "Tata Power Renewable", awardedMW: 7400, tenderCount: 16, avgTariff: 2.83 },
  { player: "JSW Neo Energy", awardedMW: 6900, tenderCount: 13, avgTariff: 2.88 },
  { player: "Avaada Energy", awardedMW: 6100, tenderCount: 12, avgTariff: 2.74 },
  { player: "SJVN Green Energy", awardedMW: 4800, tenderCount: 9, avgTariff: 2.69 },
  { player: "ACME Solar", awardedMW: 4500, tenderCount: 11, avgTariff: 2.66 },
  { player: "Greenko", awardedMW: 4200, tenderCount: 7, avgTariff: 3.42 },
  { player: "Juniper Green Energy", awardedMW: 3900, tenderCount: 10, avgTariff: 2.92 },
  { player: "Serentica Renewables", awardedMW: 3600, tenderCount: 7, avgTariff: 3.04 },
  { player: "Sembcorp Energy India", awardedMW: 2900, tenderCount: 8, avgTariff: 2.81 },
  { player: "Other developers", awardedMW: 9100, tenderCount: 29, avgTariff: 2.97 },
].sort((a, b) => b.awardedMW - a.awardedMW);

// Representative mock tender book — replaced by the live SECI snapshot when
// the ingestion run succeeds.
const records: TenderRecord[] = [
  { id: "SECI-FDRE-III", title: "SECI FDRE Tranche-III", agency: "SECI", tech: "FDRE", capacityMW: 2000, stage: "Awarded", tariff: 3.42, winner: "ReNew", state: "Pan-India", date: "Mar 2026", period: "Q4 FY26" },
  { id: "SECI-ISTS-XVI", title: "SECI ISTS Solar Tranche-XVI", agency: "SECI", tech: "Solar", capacityMW: 1200, stage: "Awarded", tariff: 2.57, winner: "NTPC Green Energy", state: "Rajasthan", date: "Feb 2026", period: "Q4 FY26" },
  { id: "SECI-BESS-II", title: "SECI Standalone BESS Tranche-II", agency: "SECI", tech: "BESS", capacityMW: 1000, stage: "Awarded", tariff: 2.21, winner: "JSW Neo Energy", state: "Gujarat", date: "Feb 2026", period: "Q4 FY26" },
  { id: "NTPC-RTC-II", title: "NTPC RTC Power Tranche-II", agency: "NTPC", tech: "RTC", capacityMW: 1500, stage: "Awarded", tariff: 4.38, winner: "Greenko", state: "Andhra Pradesh", date: "Jan 2026", period: "Q4 FY26" },
  { id: "SECI-HYB-IX", title: "SECI Solar-Wind Hybrid Tranche-IX", agency: "SECI", tech: "Hybrid", capacityMW: 1200, stage: "Awarded", tariff: 3.49, winner: "Adani Green Energy", state: "Rajasthan", date: "Jan 2026", period: "Q4 FY26" },
  { id: "GUVNL-XXIII", title: "GUVNL Phase-XXIII Solar", agency: "State DISCOM", tech: "Solar", capacityMW: 750, stage: "Awarded", tariff: 2.61, winner: "Tata Power Renewable", state: "Gujarat", date: "Dec 2025", period: "Q3 FY26" },
  { id: "SJVN-FDRE-I", title: "SJVN FDRE Tranche-I", agency: "SJVN", tech: "FDRE", capacityMW: 1500, stage: "Awarded", tariff: 3.55, winner: "Avaada Energy", state: "Pan-India", date: "Dec 2025", period: "Q3 FY26" },
  { id: "SECI-WIND-XV", title: "SECI Wind Tranche-XV", agency: "SECI", tech: "Wind", capacityMW: 1200, stage: "Awarded", tariff: 3.31, winner: "ReNew", state: "Karnataka", date: "Nov 2025", period: "Q3 FY26" },
  { id: "NHPC-SOL-RJ", title: "NHPC ISTS Solar Rajasthan", agency: "NHPC", tech: "Solar", capacityMW: 800, stage: "Awarded", tariff: 2.55, winner: "ACME Solar", state: "Rajasthan", date: "Nov 2025", period: "Q3 FY26" },
  { id: "SECI-FDRE-II", title: "SECI FDRE Tranche-II", agency: "SECI", tech: "FDRE", capacityMW: 2500, stage: "Awarded", tariff: 3.51, winner: "Serentica Renewables", state: "Pan-India", date: "Oct 2025", period: "Q3 FY26" },
  { id: "NTPC-SOL-CPSU", title: "NTPC CPSU Solar Tranche-IV", agency: "NTPC", tech: "Solar", capacityMW: 1500, stage: "Awarded", tariff: 2.53, winner: "NTPC Green Energy", state: "Madhya Pradesh", date: "Oct 2025", period: "Q3 FY26" },
  { id: "SECI-HYB-VIII", title: "SECI Solar-Wind Hybrid Tranche-VIII", agency: "SECI", tech: "Hybrid", capacityMW: 1200, stage: "Awarded", tariff: 3.44, winner: "Juniper Green Energy", state: "Maharashtra", date: "Sep 2025", period: "Q2 FY26" },
  { id: "SECI-RTC-III", title: "SECI RTC Power Tranche-III", agency: "SECI", tech: "RTC", capacityMW: 2000, stage: "Awarded", tariff: 4.45, winner: "Greenko", state: "Pan-India", date: "Sep 2025", period: "Q2 FY26" },
  { id: "MSEDCL-SOL-VII", title: "MSEDCL Solar Phase-VII", agency: "State DISCOM", tech: "Solar", capacityMW: 1000, stage: "Awarded", tariff: 2.68, winner: "Avaada Energy", state: "Maharashtra", date: "Aug 2025", period: "Q2 FY26" },
  { id: "SECI-ISTS-XV", title: "SECI ISTS Solar Tranche-XV", agency: "SECI", tech: "Solar", capacityMW: 2000, stage: "Awarded", tariff: 2.56, winner: "Adani Green Energy", state: "Rajasthan", date: "Jul 2025", period: "Q2 FY26" },
  { id: "SECI-BESS-I", title: "SECI Standalone BESS Tranche-I", agency: "SECI", tech: "BESS", capacityMW: 500, stage: "Awarded", tariff: 2.34, winner: "Sembcorp Energy India", state: "Gujarat", date: "Jun 2025", period: "Q1 FY26" },
  { id: "SJVN-SOL-II", title: "SJVN ISTS Solar Tranche-II", agency: "SJVN", tech: "Solar", capacityMW: 1200, stage: "Awarded", tariff: 2.59, winner: "SJVN Green Energy", state: "Rajasthan", date: "May 2025", period: "Q1 FY26" },
  { id: "NTPC-FDRE-I", title: "NTPC FDRE Tranche-I", agency: "NTPC", tech: "FDRE", capacityMW: 1000, stage: "Awarded", tariff: 3.58, winner: "Tata Power Renewable", state: "Pan-India", date: "Apr 2025", period: "Q1 FY26" },
  { id: "SECI-WIND-XIV", title: "SECI Wind Tranche-XIV", agency: "SECI", tech: "Wind", capacityMW: 1500, stage: "Awarded", tariff: 3.29, winner: "JSW Neo Energy", state: "Tamil Nadu", date: "Apr 2025", period: "Q1 FY26" },
  { id: "SECI-FDRE-IV", title: "SECI FDRE Tranche-IV", agency: "SECI", tech: "FDRE", capacityMW: 2500, stage: "Under Evaluation", winner: undefined, state: "Pan-India", date: "Apr 2026", period: "Q1 FY27" },
  { id: "NTPC-BESS-III", title: "NTPC Standalone BESS Tranche-III", agency: "NTPC", tech: "BESS", capacityMW: 1500, stage: "Under Evaluation", state: "Pan-India", date: "Apr 2026", period: "Q1 FY27" },
  { id: "SECI-HYB-X", title: "SECI Solar-Wind Hybrid Tranche-X", agency: "SECI", tech: "Hybrid", capacityMW: 1500, stage: "Bids Submitted", state: "Gujarat", date: "Mar 2026", period: "Q4 FY26" },
  { id: "SECI-RTC-IV", title: "SECI RTC Power Tranche-IV", agency: "SECI", tech: "RTC", capacityMW: 2000, stage: "Bids Submitted", state: "Pan-India", date: "Mar 2026", period: "Q4 FY26" },
  { id: "GUVNL-XXIV", title: "GUVNL Phase-XXIV Solar", agency: "State DISCOM", tech: "Solar", capacityMW: 1000, stage: "Bids Submitted", state: "Gujarat", date: "Feb 2026", period: "Q4 FY26" },
  { id: "SECI-WIND-XVI", title: "SECI Wind Tranche-XVI", agency: "SECI", tech: "Wind", capacityMW: 1200, stage: "Announced", state: "Karnataka", date: "May 2026", period: "Q1 FY27" },
  { id: "NHPC-FDRE-I", title: "NHPC FDRE Tranche-I", agency: "NHPC", tech: "FDRE", capacityMW: 1500, stage: "Announced", state: "Pan-India", date: "May 2026", period: "Q1 FY27" },
  { id: "SECI-BESS-III", title: "SECI Standalone BESS Tranche-III", agency: "SECI", tech: "BESS", capacityMW: 1000, stage: "Announced", state: "Maharashtra", date: "May 2026", period: "Q1 FY27" },
  { id: "RUVNL-SOL-III", title: "RUVNL Solar Phase-III", agency: "State DISCOM", tech: "Solar", capacityMW: 800, stage: "Awarded", tariff: 2.62, winner: "ACME Solar", state: "Rajasthan", date: "Aug 2025", period: "Q2 FY26" },
  { id: "SECI-ISTS-XIV", title: "SECI ISTS Solar Tranche-XIV", agency: "SECI", tech: "Solar", capacityMW: 1800, stage: "Awarded", tariff: 2.54, winner: "ReNew", state: "Rajasthan", date: "Feb 2025", period: "Q4 FY25" },
  { id: "SECI-HYB-VII", title: "SECI Solar-Wind Hybrid Tranche-VII", agency: "SECI", tech: "Hybrid", capacityMW: 1200, stage: "Awarded", tariff: 3.38, winner: "Adani Green Energy", state: "Rajasthan", date: "Dec 2024", period: "Q3 FY25" },
  { id: "SJVN-WIND-I", title: "SJVN Wind Tranche-I", agency: "SJVN", tech: "Wind", capacityMW: 600, stage: "Awarded", tariff: 3.24, winner: "Juniper Green Energy", state: "Gujarat", date: "Nov 2024", period: "Q3 FY25" },
  { id: "NTPC-RTC-I", title: "NTPC RTC Power Tranche-I", agency: "NTPC", tech: "RTC", capacityMW: 1200, stage: "Awarded", tariff: 4.32, winner: "Greenko", state: "Andhra Pradesh", date: "Sep 2024", period: "Q2 FY25" },
];

export const tenderMock: Dataset<TenderData> = {
  meta: {
    status: "mock",
    sourceName: "Mock dataset — tenders (v1)",
    note: "Synthetic FY22–FY26 award series + representative tender book. The records list is swapped for the live SECI snapshot when ingestion succeeds.",
  },
  value: { quarterlyAwards, mix, players, records },
};

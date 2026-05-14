/**
 * Mock dataset — IPP (independent power producer) league table. Operational /
 * under-construction / pipeline / PPA-tied capacity and technology mix per
 * player. Synthetic until company-level disclosure ingestion is built — see
 * SOLAR_DASHBOARD_PLAN.md. techMix sums to operationalMW for each player.
 */
import type { Dataset, IppPlayer } from "@/lib/types";

const players: IppPlayer[] = [
  {
    id: "adani-green",
    name: "Adani Green Energy",
    operationalMW: 12150,
    underConstructionMW: 4200,
    pipelineMW: 18500,
    ppaAwardedMW: 14800,
    techMix: [
      { tech: "Solar", mw: 9800 },
      { tech: "Wind", mw: 1450 },
      { tech: "Hybrid", mw: 900 },
    ],
    hq: "Ahmedabad",
    note: "Khavda RE park anchor; stated 50 GW-by-2030 ambition.",
  },
  {
    id: "renew",
    name: "ReNew",
    operationalMW: 10200,
    underConstructionMW: 2800,
    pipelineMW: 9600,
    ppaAwardedMW: 13500,
    techMix: [
      { tech: "Solar", mw: 5200 },
      { tech: "Wind", mw: 4100 },
      { tech: "Hybrid", mw: 900 },
    ],
    hq: "Gurugram",
    note: "Most wind-weighted of the large platforms.",
  },
  {
    id: "greenko",
    name: "Greenko",
    operationalMW: 7600,
    underConstructionMW: 2900,
    pipelineMW: 6800,
    ppaAwardedMW: 4200,
    techMix: [
      { tech: "Solar", mw: 3100 },
      { tech: "Wind", mw: 3000 },
      { tech: "Hydro", mw: 1500 },
    ],
    hq: "Hyderabad",
    note: "Pumped-hydro + RTC storage specialist.",
  },
  {
    id: "tata-power-renewable",
    name: "Tata Power Renewable",
    operationalMW: 5600,
    underConstructionMW: 2400,
    pipelineMW: 5200,
    ppaAwardedMW: 7400,
    techMix: [
      { tech: "Solar", mw: 4400 },
      { tech: "Wind", mw: 1000 },
      { tech: "Hybrid", mw: 200 },
    ],
    hq: "Mumbai",
    note: "Integrated with Tata Power's distribution + cell/module manufacturing.",
  },
  {
    id: "sembcorp",
    name: "Sembcorp Energy India",
    operationalMW: 4300,
    underConstructionMW: 1500,
    pipelineMW: 2900,
    ppaAwardedMW: 2900,
    techMix: [
      { tech: "Solar", mw: 2600 },
      { tech: "Wind", mw: 1500 },
      { tech: "Hybrid", mw: 200 },
    ],
    hq: "Gurugram",
  },
  {
    id: "jsw-energy",
    name: "JSW Energy",
    operationalMW: 4200,
    underConstructionMW: 3300,
    pipelineMW: 7100,
    ppaAwardedMW: 6900,
    techMix: [
      { tech: "Solar", mw: 2100 },
      { tech: "Wind", mw: 1700 },
      { tech: "Hybrid", mw: 400 },
    ],
    hq: "Mumbai",
    note: "O2 Power acquisition added utility-scale scale; fast PPA build-out.",
  },
  {
    id: "avaada",
    name: "Avaada Energy",
    operationalMW: 4100,
    underConstructionMW: 3100,
    pipelineMW: 5400,
    ppaAwardedMW: 6100,
    techMix: [
      { tech: "Solar", mw: 3700 },
      { tech: "Wind", mw: 200 },
      { tech: "Hybrid", mw: 200 },
    ],
    hq: "Mumbai",
    note: "Pairing generation with green-hydrogen / ammonia plans.",
  },
  {
    id: "ntpc-green",
    name: "NTPC Green Energy",
    operationalMW: 3850,
    underConstructionMW: 6100,
    pipelineMW: 11200,
    ppaAwardedMW: 9300,
    techMix: [
      { tech: "Solar", mw: 3300 },
      { tech: "Wind", mw: 550 },
    ],
    hq: "New Delhi",
    note: "Largest under-construction book post-IPO; CPSU + SECI award routes.",
  },
  {
    id: "acme-solar",
    name: "ACME Solar",
    operationalMW: 2900,
    underConstructionMW: 2600,
    pipelineMW: 3800,
    ppaAwardedMW: 4500,
    techMix: [
      { tech: "Solar", mw: 2500 },
      { tech: "FDRE", mw: 250 },
      { tech: "Hybrid", mw: 150 },
    ],
    hq: "Gurugram",
    note: "Shifting mix toward FDRE / firm-power tenders.",
  },
  {
    id: "hero-future",
    name: "Hero Future Energies",
    operationalMW: 2350,
    underConstructionMW: 1200,
    pipelineMW: 2600,
    ppaAwardedMW: 2400,
    techMix: [
      { tech: "Solar", mw: 1850 },
      { tech: "Wind", mw: 400 },
      { tech: "Hybrid", mw: 100 },
    ],
    hq: "New Delhi",
  },
  {
    id: "juniper-green",
    name: "Juniper Green Energy",
    operationalMW: 2100,
    underConstructionMW: 1900,
    pipelineMW: 3500,
    ppaAwardedMW: 3900,
    techMix: [
      { tech: "Solar", mw: 1500 },
      { tech: "Wind", mw: 400 },
      { tech: "Hybrid", mw: 200 },
    ],
    hq: "New Delhi",
  },
].sort((a, b) => b.operationalMW - a.operationalMW);

export const ippMock: Dataset<IppPlayer[]> = {
  meta: {
    status: "mock",
    sourceName: "Mock dataset — IPP league table (v1)",
    note: "Synthetic player capacities. Live ingestion would aggregate company disclosures, investor decks and SECI/agency award data.",
  },
  value: players,
};

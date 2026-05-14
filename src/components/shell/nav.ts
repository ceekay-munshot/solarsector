import {
  Building2,
  Database,
  Factory,
  Gavel,
  IndianRupee,
  LayoutDashboard,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

/** Single source of truth for the dashboard's routes / navigation. */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Executive cockpit",
  },
  {
    href: "/dcr",
    label: "DCR",
    icon: Factory,
    description: "Module & cell production",
  },
  {
    href: "/tenders",
    label: "Tenders",
    icon: Gavel,
    description: "Awards & tender mix",
  },
  {
    href: "/tariffs",
    label: "Tariffs",
    icon: IndianRupee,
    description: "Discovered tariffs",
  },
  {
    href: "/capacity",
    label: "Capacity",
    icon: Zap,
    description: "Commissioning by source",
  },
  {
    href: "/demand",
    label: "Demand",
    icon: TrendingUp,
    description: "Power demand growth",
  },
  {
    href: "/ipp",
    label: "IPP",
    icon: Building2,
    description: "Developer pipelines",
  },
  {
    href: "/sources",
    label: "Sources",
    icon: Database,
    description: "Data source registry",
  },
];

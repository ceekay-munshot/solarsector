"use client";

import clsx from "clsx";
import { Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sourceRegistry } from "@/data/sources";
import { NAV_ITEMS } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const liveCount = sourceRegistry.filter((s) => s.status === "live").length;
  const total = sourceRegistry.length;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-surface/85 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber to-orange shadow-lg shadow-amber/20">
          <Sun className="h-5 w-5 text-[#1a1206]" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink">Solar Command</div>
          <div className="text-[11px] text-faint">India Power Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                active
                  ? "bg-white/[0.06] text-ink"
                  : "text-muted hover:bg-white/[0.03] hover:text-ink",
              )}
            >
              <span
                className={clsx(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  active
                    ? "bg-amber/15 text-amber"
                    : "bg-white/[0.04] text-faint group-hover:text-muted",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block truncate text-[11px] text-faint">
                  {item.description}
                </span>
              </span>
              {active && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <div className="rounded-xl bg-white/[0.03] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted">
              Live source health
            </span>
            <span className="num text-[11px] text-faint">
              {liveCount}/{total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald to-blue"
              style={{ width: `${(liveCount / total) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-faint">
            Mixed-data prototype — live where reachable, mock fallback elsewhere.
          </p>
        </div>
      </div>
    </aside>
  );
}

"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sourceRegistry } from "@/data/sources";
import { NAV_ITEMS } from "./nav";

export function Topbar() {
  const pathname = usePathname();
  const current =
    NAV_ITEMS.find((n) => n.href === pathname) ?? NAV_ITEMS[0];
  const liveCount = sourceRegistry.filter((s) => s.status === "live").length;
  const total = sourceRegistry.length;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-base/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-7 lg:px-9">
        <div className="min-w-0">
          <div className="eyebrow">India Solar &amp; Power · {current.label}</div>
          <h1 className="truncate text-sm font-semibold text-ink">
            {current.description}
          </h1>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-2/70 px-2.5 py-1 text-[11px] text-muted sm:inline-flex">
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              liveCount > 0 ? "bg-emerald animate-pulse-dot" : "bg-orange",
            )}
          />
          {liveCount}/{total} sources live · mixed-data prototype
        </span>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line-soft px-3 py-2 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-white/[0.07] text-ink"
                  : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

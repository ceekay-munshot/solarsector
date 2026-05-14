"use client";

import { FilterProvider } from "@/components/filters/FilterContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** App chrome: fixed sidebar, sticky topbar, filtered content area. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FilterProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
          <Topbar />
          <main className="flex-1 px-5 py-6 sm:px-7 lg:px-9">
            <div className="fade-up mx-auto max-w-[1500px]">{children}</div>
          </main>
          <footer className="border-t border-line px-5 py-5 sm:px-7 lg:px-9">
            <div className="mx-auto flex max-w-[1500px] flex-col gap-1 text-[11px] text-faint sm:flex-row sm:items-center sm:justify-between">
              <span>
                India Solar &amp; Power — Command Center · mixed-data research
                prototype
              </span>
              <span>
                Live data fetched where reachable · mock fallback elsewhere ·
                every visual badges its source
              </span>
            </div>
          </footer>
        </div>
      </div>
    </FilterProvider>
  );
}

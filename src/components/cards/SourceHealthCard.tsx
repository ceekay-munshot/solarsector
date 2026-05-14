import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import { Panel } from "@/components/primitives/Panel";
import { PROBE_STATUS } from "@/lib/dataStatus";
import { formatFreshness } from "@/lib/format";
import { tone } from "@/lib/tone";
import type { SourceRegistryEntry } from "@/lib/types";

/** Source-health card for the Sources registry page. */
export function SourceHealthCard({ entry }: { entry: SourceRegistryEntry }) {
  const cfg = PROBE_STATUS[entry.status];
  const t = tone(cfg.tone);
  return (
    <Panel hover className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "h-2 w-2 shrink-0 rounded-full",
                t.dot,
                entry.status === "live" && "animate-pulse-dot",
              )}
            />
            <h3 className="truncate text-sm font-semibold text-ink">
              {entry.name}
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-faint">
            {entry.category} · ingestion priority {entry.ingestionPriority}
          </p>
        </div>
        <span
          className={clsx(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            t.fill,
            t.border,
            t.text,
          )}
        >
          {cfg.label}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-muted">{entry.plannedUse}</p>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/[0.025] px-3 py-2 text-[11px]">
        <div>
          <div className="text-faint">HTTP</div>
          <div className="num text-muted">{entry.httpStatus ?? "—"}</div>
        </div>
        <div>
          <div className="text-faint">Latency</div>
          <div className="num text-muted">
            {entry.latencyMs !== undefined ? `${entry.latencyMs} ms` : "—"}
          </div>
        </div>
        <div>
          <div className="text-faint">Checked</div>
          <div className="text-muted">{formatFreshness(entry.lastChecked)}</div>
        </div>
      </div>

      {entry.errorMessage && (
        <p className="rounded-md bg-red/10 px-2 py-1 text-[11px] text-red/90">
          {entry.errorMessage}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
        <span className="text-[11px] text-faint">
          Used by: {entry.pages.join(", ")}
        </span>
        <a
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-[11px] text-faint transition-colors hover:text-blue"
        >
          <ExternalLink className="h-3 w-3" />
          Visit
        </a>
      </div>
    </Panel>
  );
}

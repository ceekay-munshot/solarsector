import { DataBadge } from "@/components/badges/DataBadge";
import type { SourceMeta } from "@/lib/types";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Provenance summary — one badge per dataset feeding the page. */
  datasets?: { label: string; meta: Pick<SourceMeta, "status"> }[];
}

/** Standard page masthead: eyebrow, title, lede, and a data-provenance strip. */
export function PageHeader({
  eyebrow,
  title,
  description,
  datasets,
}: PageHeaderProps) {
  return (
    <header className="mb-6">
      <div className="eyebrow mb-1.5">{eyebrow}</div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.7rem]">
        {title}
      </h1>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
        {description}
      </p>
      {datasets && datasets.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className="eyebrow !tracking-wider">Data on this page</span>
          {datasets.map((d) => (
            <span
              key={d.label}
              className="inline-flex items-center gap-1.5 text-[11px] text-faint"
            >
              {d.label}
              <DataBadge status={d.meta.status} size="sm" compact />
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

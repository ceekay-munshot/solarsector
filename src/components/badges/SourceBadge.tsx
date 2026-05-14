import { ExternalLink } from "lucide-react";
import clsx from "clsx";

interface SourceBadgeProps {
  name: string;
  url?: string;
  className?: string;
}

/** Compact "Source: …" label, linking out to the upstream source when known. */
export function SourceBadge({ name, url, className }: SourceBadgeProps) {
  const body = (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[11px] text-faint transition-colors",
        url && "hover:text-muted",
        className,
      )}
    >
      <span className="text-faint/70">Source:</span>
      <span className="truncate">{name}</span>
      {url && <ExternalLink className="h-2.5 w-2.5 shrink-0" />}
    </span>
  );
  if (!url) return body;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="min-w-0">
      {body}
    </a>
  );
}

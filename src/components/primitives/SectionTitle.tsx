interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Section header with an uppercase eyebrow and an optional right-side action. */
export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: SectionTitleProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-faint">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

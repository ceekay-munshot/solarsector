import clsx from "clsx";

interface TagProps {
  label: string;
  /** Optional colour dot (e.g. technology / source colour). */
  color?: string;
  className?: string;
}

/** Small chip for technologies, agencies, stages, etc. */
export function Tag({ label, color, className }: TagProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-muted",
        className,
      )}
    >
      {color && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </span>
  );
}

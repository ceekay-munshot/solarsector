import clsx from "clsx";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  /** Add the interactive hover treatment. */
  hover?: boolean;
  as?: "div" | "section" | "article";
}

/** The base glass surface every card is built on. */
export function Panel({ children, className, hover = false, as: Tag = "div" }: PanelProps) {
  return (
    <Tag className={clsx("glass rounded-2xl", hover && "glass-hover", className)}>
      {children}
    </Tag>
  );
}

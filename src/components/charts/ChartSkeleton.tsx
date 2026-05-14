/** Sized placeholder shown while a chart waits for client-side mount. */
export function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="w-full animate-pulse rounded-lg bg-white/[0.03]"
    />
  );
}

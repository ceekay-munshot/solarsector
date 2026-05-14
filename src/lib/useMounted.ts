"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only after the component has mounted / hydrated on the client.
 *
 * Recharts' ResponsiveContainer cannot measure its parent during server
 * prerender, so charts gate on this and render a sized skeleton until the
 * client takes over — no layout shift, no prerender warnings.
 *
 * Implemented with `useSyncExternalStore` (server snapshot `false`, client
 * snapshot `true`) — the hydration-safe pattern, no setState-in-effect.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

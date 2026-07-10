import { useEffect, useRef, useState } from "react";
import type { Stats, Topology } from "../../../shared/api-types";
import { fetchStats } from "../api";
import { usePoll } from "./usePoll";

export interface ComponentRates {
  /** events/s into the component (null until two samples exist) */
  inRate: number | null;
  /** events/s out of the component */
  outRate: number | null;
  /** events/s per named output */
  outputRates: Record<string, number>;
  errorsTotal: number;
}

export interface LiveStats {
  rates: Record<string, ComponentRates>;
  /** aggregate events/s emitted by sources / delivered by sinks */
  aggInRate: number | null;
  aggOutRate: number | null;
  /** last ~60 samples of aggInRate for the sparkline */
  history: number[];
  vectorReachable: boolean;
  stale: boolean;
  stats: Stats | null;
}

const HISTORY_LEN = 60;

function computeRates(prev: Stats, cur: Stats): Record<string, ComponentRates> {
  const dt = (cur.ts - prev.ts) / 1000;
  const rates: Record<string, ComponentRates> = {};
  const rate = (c: number | null, p: number | null | undefined) =>
    c === null || p === null || p === undefined
      ? null
      : Math.max(0, (c - p) / dt); // negative delta = Vector restarted; clamp
  for (const [id, c] of Object.entries(cur.components)) {
    const p = prev.components[id];
    const outputRates: Record<string, number> = {};
    for (const [out, v] of Object.entries(c.outputs)) {
      outputRates[out] = rate(v, p?.outputs[out]) ?? 0;
    }
    rates[id] = {
      inRate: rate(c.receivedEventsTotal, p?.receivedEventsTotal),
      outRate: rate(c.sentEventsTotal, p?.sentEventsTotal),
      outputRates,
      errorsTotal: c.errorsTotal ?? 0,
    };
  }
  return rates;
}

export function useStatsPolling(topology: Topology | null): LiveStats {
  const { value: stats, stale } = usePoll(fetchStats, 2000);
  const prevRef = useRef<Stats | null>(null);
  const [live, setLive] = useState<Omit<LiveStats, "vectorReachable" | "stale" | "stats">>({
    rates: {},
    aggInRate: null,
    aggOutRate: null,
    history: [],
  });

  useEffect(() => {
    if (!stats) return;
    const prev = prevRef.current;
    // Identical ts means the server snapshot hasn't advanced (Vector down):
    // keep showing the last computed rates rather than decaying to 0.
    if (!prev || stats.ts === prev.ts) {
      if (!prev) prevRef.current = stats;
      return;
    }
    const rates = computeRates(prev, stats);
    prevRef.current = stats;

    let aggIn: number | null = null;
    let aggOut: number | null = null;
    for (const node of topology?.nodes ?? []) {
      const r = rates[node.id];
      if (!r) continue;
      if (node.kind === "source" && r.outRate !== null) {
        aggIn = (aggIn ?? 0) + r.outRate;
      } else if (node.kind === "sink" && r.outRate !== null) {
        aggOut = (aggOut ?? 0) + r.outRate;
      }
    }

    setLive((old) => ({
      rates,
      aggInRate: aggIn,
      aggOutRate: aggOut,
      history: [...old.history, aggIn ?? 0].slice(-HISTORY_LEN),
    }));
  }, [stats, topology]);

  return {
    ...live,
    vectorReachable: stats?.vectorReachable ?? false,
    stale,
    stats,
  };
}

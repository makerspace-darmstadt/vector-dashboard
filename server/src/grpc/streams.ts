import type { ClientReadableStream } from "@grpc/grpc-js";
import { client } from "./client.js";

const STREAM_INTERVAL_MS = 2000;
const BACKOFF_MIN_MS = 1000;
const BACKOFF_MAX_MS = 15000;

/**
 * Keeps a server-streaming RPC alive forever: reconnects with exponential
 * backoff on error/end, resets the backoff once data flows again.
 */
function keepStreaming<T>(
  name: string,
  open: () => ClientReadableStream<T>,
  onData: (msg: T) => void
): void {
  let backoff = BACKOFF_MIN_MS;

  const connect = () => {
    const stream = open();
    const retry = () => {
      stream.removeAllListeners();
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, BACKOFF_MAX_MS);
    };
    stream.on("data", (msg: T) => {
      backoff = BACKOFF_MIN_MS;
      onData(msg);
    });
    stream.on("error", (err: Error) => {
      console.warn(`${name} stream error: ${err.message}`);
      retry();
    });
    stream.on("end", retry);
  };

  connect();
}

interface ComponentMetricMsg {
  componentId: string;
  total?: { value: number; outputTotals: Record<string, number> };
  throughput?: { value: number };
}

// componentId -> cumulative errors_total. Vector only emits entries for
// components whose error counter exists (i.e. at least one error happened),
// so absence simply means 0.
const errorsTotals = new Map<string, number>();
let uptimeSeconds: number | null = null;

export function startStreams(): void {
  keepStreaming<ComponentMetricMsg>(
    "errors_total",
    () =>
      (client as any).streamComponentMetrics({
        intervalMs: STREAM_INTERVAL_MS,
        metric: "METRIC_NAME_ERRORS_TOTAL",
      }),
    (msg) => {
      if (msg.total) errorsTotals.set(msg.componentId, msg.total.value);
    }
  );

  keepStreaming<{ uptimeSeconds: number }>(
    "uptime",
    () => (client as any).streamUptime({ intervalMs: STREAM_INTERVAL_MS }),
    (msg) => {
      uptimeSeconds = msg.uptimeSeconds;
    }
  );
}

export function getErrorsTotal(componentId: string): number {
  return errorsTotals.get(componentId) ?? 0;
}

export function sumErrorsTotals(): number {
  let sum = 0;
  for (const v of errorsTotals.values()) sum += v;
  return sum;
}

export function getUptimeSeconds(): number | null {
  return uptimeSeconds;
}

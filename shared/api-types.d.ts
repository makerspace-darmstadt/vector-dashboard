/**
 * JSON API contract between the dashboard server and the web UI.
 * Declaration-only module: imported with `import type` from both packages,
 * never emitted or bundled.
 */

export type ComponentKind = "source" | "transform" | "sink";

export interface Overview {
  /** Vector /health OK and the gRPC poll snapshot is fresh */
  healthy: boolean;
  vectorReachable: boolean;
  version: string | null;
  hostname: string | null;
  uptimeSeconds: number | null;
  totals: {
    receivedEvents: number;
    sentEvents: number;
    errors: number;
  };
  /** Server-side timestamp (ms epoch) of the underlying snapshot */
  ts: number;
}

export interface TopologyNode {
  id: string;
  kind: ComponentKind;
  /** Vector component type, e.g. "remap", "syslog" */
  type: string;
  /** Present in the running instance's gRPC component list */
  live: boolean;
}

export interface TopologyEdge {
  from: string;
  to: string;
  /** Named output of the upstream component (e.g. route output), if any */
  output?: string;
}

export interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  /** Set when the Vector config file could not be read; nodes then come from the gRPC snapshot and edges are unavailable */
  configError?: string;
}

export interface ComponentStats {
  receivedEventsTotal: number | null;
  sentEventsTotal: number | null;
  receivedBytesTotal: number | null;
  sentBytesTotal: number | null;
  /** sent_events_total per named output */
  outputs: Record<string, number>;
  errorsTotal: number | null;
}

export interface Stats {
  /** Server-side timestamp (ms epoch) the snapshot was taken */
  ts: number;
  vectorReachable: boolean;
  components: Record<string, ComponentStats>;
}

export interface ComponentConfig {
  id: string;
  kind: ComponentKind;
  type: string;
  /** Redacted component configuration as parsed from the Vector config file */
  config: unknown;
}

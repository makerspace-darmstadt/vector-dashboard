import { Router } from "express";
import type {
  ComponentConfig,
  ComponentKind,
  Overview,
  Stats,
  Topology,
} from "../../shared/api-types.js";
import { loadVectorConfig } from "./config/loader.js";
import { redact } from "./config/redact.js";
import { buildTopology } from "./config/topology.js";
import type { GrpcComponentType } from "./grpc/client.js";
import { getMetaInfo, getSnapshot, isReachable } from "./grpc/poller.js";
import { getErrorsTotal, getUptimeSeconds, sumErrorsTotals } from "./grpc/streams.js";
import { isVectorHealthy } from "./health.js";

const KIND_BY_GRPC_TYPE: Partial<Record<GrpcComponentType, ComponentKind>> = {
  COMPONENT_TYPE_SOURCE: "source",
  COMPONENT_TYPE_TRANSFORM: "transform",
  COMPONENT_TYPE_SINK: "sink",
};

export const api = Router();

api.get("/overview", (_req, res) => {
  const snapshot = getSnapshot();
  const meta = getMetaInfo();

  // "in" = events emitted by sources, "out" = events delivered by sinks
  let receivedEvents = 0;
  let sentEvents = 0;
  for (const c of snapshot?.components ?? []) {
    if (c.componentType === "COMPONENT_TYPE_SOURCE") {
      receivedEvents += c.metrics?.sentEventsTotal ?? 0;
    } else if (c.componentType === "COMPONENT_TYPE_SINK") {
      sentEvents += c.metrics?.sentEventsTotal ?? 0;
    }
  }

  const body: Overview = {
    healthy: isVectorHealthy() && isReachable(),
    vectorReachable: isReachable(),
    version: meta?.version ?? null,
    hostname: meta?.hostname ?? null,
    uptimeSeconds: getUptimeSeconds(),
    totals: { receivedEvents, sentEvents, errors: sumErrorsTotals() },
    ts: snapshot?.ts ?? Date.now(),
  };
  res.json(body);
});

api.get("/topology", (_req, res) => {
  const snapshot = getSnapshot();
  const liveIds = new Set(snapshot?.components.map((c) => c.componentId) ?? []);
  const config = loadVectorConfig();

  let body: Topology;
  if (config) {
    body = buildTopology(config, liveIds);
  } else {
    // Degraded mode: nodes from the running instance, no edges/config.
    body = {
      nodes: (snapshot?.components ?? []).map((c) => ({
        id: c.componentId,
        kind: KIND_BY_GRPC_TYPE[c.componentType] ?? "transform",
        type: c.onType,
        live: true,
      })),
      edges: [],
      configError: "Vector config file unavailable; topology edges cannot be derived",
    };
  }
  res.json(body);
});

api.get("/stats", (_req, res) => {
  const snapshot = getSnapshot();
  const body: Stats = {
    ts: snapshot?.ts ?? Date.now(),
    vectorReachable: isReachable(),
    components: {},
  };
  for (const c of snapshot?.components ?? []) {
    const outputs: Record<string, number> = {};
    for (const o of c.outputs ?? []) outputs[o.outputId] = o.sentEventsTotal;
    body.components[c.componentId] = {
      receivedEventsTotal: c.metrics?.receivedEventsTotal ?? null,
      sentEventsTotal: c.metrics?.sentEventsTotal ?? null,
      receivedBytesTotal: c.metrics?.receivedBytesTotal ?? null,
      sentBytesTotal: c.metrics?.sentBytesTotal ?? null,
      outputs,
      errorsTotal: getErrorsTotal(c.componentId),
    };
  }
  res.json(body);
});

api.get("/config/:componentId", (req, res) => {
  const config = loadVectorConfig();
  if (!config) {
    res.status(503).json({ error: "Vector config file unavailable" });
    return;
  }
  const id = req.params.componentId;
  const sections: [ComponentKind, Record<string, { type?: string }>][] = [
    ["source", config.sources],
    ["transform", config.transforms],
    ["sink", config.sinks],
  ];
  for (const [kind, defs] of sections) {
    const def = defs[id];
    if (def) {
      const body: ComponentConfig = {
        id,
        kind,
        type: def.type ?? "unknown",
        config: redact(def),
      };
      res.json(body);
      return;
    }
  }
  res.status(404).json({ error: `unknown component: ${id}` });
});

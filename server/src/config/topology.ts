import type {
  ComponentKind,
  Topology,
  TopologyEdge,
  TopologyNode,
} from "../../../shared/api-types.js";
import type { VectorConfig } from "./loader.js";

/**
 * Derives the pipeline DAG from the config's inputs[] arrays. An input entry
 * is either a plain component id or `component.output_name` (route outputs,
 * `_unmatched`, ...). Component ids may themselves contain dots, so named
 * outputs are resolved by longest-prefix match against known ids.
 */
export function buildTopology(
  config: VectorConfig,
  liveIds: Set<string>
): Topology {
  const nodes = new Map<string, TopologyNode>();
  const edges: TopologyEdge[] = [];

  const addNodes = (defs: Record<string, { type?: string }>, kind: ComponentKind) => {
    for (const [id, def] of Object.entries(defs)) {
      nodes.set(id, { id, kind, type: def.type ?? "unknown", live: liveIds.has(id) });
    }
  };
  addNodes(config.sources, "source");
  addNodes(config.transforms, "transform");
  addNodes(config.sinks, "sink");

  const resolveInput = (input: string): { from: string; output?: string } => {
    if (nodes.has(input)) return { from: input };
    let best = "";
    for (const id of nodes.keys()) {
      if (input.startsWith(id + ".") && id.length > best.length) best = id;
    }
    if (best) return { from: best, output: input.slice(best.length + 1) };
    // Unknown reference (config typo or disabled component): surface it as a
    // dead node instead of silently dropping the edge.
    nodes.set(input, { id: input, kind: "source", type: "unknown", live: false });
    return { from: input };
  };

  const addEdges = (defs: Record<string, { inputs?: string[] }>) => {
    for (const [id, def] of Object.entries(defs)) {
      for (const input of def.inputs ?? []) {
        const { from, output } = resolveInput(input);
        edges.push(output ? { from, to: id, output } : { from, to: id });
      }
    }
  };
  addEdges(config.transforms);
  addEdges(config.sinks);

  return { nodes: [...nodes.values()], edges };
}

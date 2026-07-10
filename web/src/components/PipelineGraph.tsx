import dagre from "@dagrejs/dagre";
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import type { Topology } from "../../../shared/api-types";
import type { LiveStats } from "../hooks/useStatsPolling";
import { ComponentNode, type ComponentNodeData } from "./ComponentNode";

const nodeTypes = { component: ComponentNode };

const NODE_W = 230;
const NODE_H = 88;

function layoutTopology(
  topology: Topology,
  onSelect: (id: string) => void
): { nodes: Node<ComponentNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 32, ranksep: 90 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of topology.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of topology.edges) g.setEdge(e.from, e.to);
  dagre.layout(g);

  const nodes: Node<ComponentNodeData>[] = topology.nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "component",
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: { node: n, onSelect },
    };
  });

  const edges: Edge[] = topology.edges.map((e) => ({
    id: `${e.from}${e.output ? `.${e.output}` : ""}->${e.to}`,
    source: e.from,
    target: e.to,
    label: e.output,
  }));

  return { nodes, edges };
}

interface Props {
  topology: Topology;
  live: LiveStats;
  onSelect: (id: string) => void;
}

export function PipelineGraph({ topology, live, onSelect }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ComponentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Re-layout only on structural change, not on every 30s topology refetch
  // (which returns a new-but-identical object) — layout resets drag positions.
  const topoKey = useMemo(() => JSON.stringify(topology), [topology]);

  useEffect(() => {
    const l = layoutTopology(JSON.parse(topoKey) as Topology, onSelect);
    setNodes(l.nodes);
    setEdges(l.edges);
  }, [topoKey, onSelect, setNodes, setEdges]);

  // Push fresh rates into node data and animate edges that carry traffic.
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, rates: live.rates[n.id] } }))
    );
    setEdges((eds) =>
      eds.map((e) => {
        const r = live.rates[e.source];
        const rate = e.label ? r?.outputRates[String(e.label)] ?? 0 : r?.outRate ?? 0;
        return { ...e, animated: rate > 0 };
      })
    );
  }, [live.rates, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15, maxZoom: 1.1 }}
      minZoom={0.3}
      nodesConnectable={false}
      deleteKeyCode={null}
      colorMode="dark"
      proOptions={{ hideAttribution: false }}
    >
      <Background gap={24} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

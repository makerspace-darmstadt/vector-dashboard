import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TopologyNode } from "../../../shared/api-types";
import { fmtRate } from "../format";
import type { ComponentRates } from "../hooks/useStatsPolling";
import { getIcon } from "../icons";

export interface ComponentNodeData {
  node: TopologyNode;
  rates?: ComponentRates;
  onSelect: (id: string) => void;
  [key: string]: unknown;
}

const KIND_LABEL = { source: "SRC", transform: "XFORM", sink: "SINK" } as const;

export function ComponentNode({ data }: NodeProps) {
  const { node, rates, onSelect } = data as ComponentNodeData;
  const errors = rates?.errorsTotal ?? 0;

  return (
    <div
      className={`component-node kind-${node.kind}${node.live ? "" : " not-live"}`}
      onClick={() => onSelect(node.id)}
      title={node.live ? undefined : "In config but not present in the running instance"}
    >
      {node.kind !== "source" && <Handle type="target" position={Position.Left} />}
      <div className="node-head">
        <span className="node-icon">{getIcon(node.type, node.kind)}</span>
        <span className="node-id">{node.id}</span>
        <span className={`node-badge badge-${node.kind}`}>{KIND_LABEL[node.kind]}</span>
      </div>
      <div className="node-type">{node.type}</div>
      <div className="node-stats">
        {node.kind !== "source" && (
          <span>
            in <b>{fmtRate(rates?.inRate)}</b>
          </span>
        )}
        <span>
          out <b>{fmtRate(rates?.outRate)}</b>
        </span>
        {errors > 0 && <span className="node-errors">errors {errors}</span>}
      </div>
      {node.kind !== "sink" && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

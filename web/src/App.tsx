import { useCallback, useState } from "react";
import { fetchOverview, fetchTopology } from "./api";
import { ConfigDrawer } from "./components/ConfigDrawer";
import { OverviewHeader } from "./components/OverviewHeader";
import { PipelineGraph } from "./components/PipelineGraph";
import { usePoll } from "./hooks/usePoll";
import { useStatsPolling } from "./hooks/useStatsPolling";

export default function App() {
  const { value: overview } = usePoll(fetchOverview, 5000);
  const { value: topology } = usePoll(fetchTopology, 30000);
  const live = useStatsPolling(topology);
  const [selected, setSelected] = useState<string | null>(null);

  const onSelect = useCallback((id: string) => setSelected(id), []);

  return (
    <div className="app">
      <OverviewHeader overview={overview} live={live} />
      {overview && !overview.vectorReachable && (
        <div className="banner banner-error">
          Vector is unreachable — showing last known state
        </div>
      )}
      {topology?.configError && (
        <div className="banner banner-warn">{topology.configError}</div>
      )}
      <main className="graph-area">
        {topology ? (
          <PipelineGraph topology={topology} live={live} onSelect={onSelect} />
        ) : (
          <p className="loading">Connecting…</p>
        )}
      </main>
      {selected && (
        <ConfigDrawer componentId={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

import type { Overview } from "../../../shared/api-types";
import { fmtCount, fmtRate, fmtUptime, fmtVersion } from "../format";
import type { LiveStats } from "../hooks/useStatsPolling";
import { Sparkline } from "./Sparkline";

interface Props {
  overview: Overview | null;
  live: LiveStats;
}

export function OverviewHeader({ overview, live }: Props) {
  const healthy = overview?.healthy ?? false;
  return (
    <header className="overview">
      <div className="overview-left">
        <span className={`health-dot ${healthy ? "ok" : "bad"}`} />
        <h1>Vector</h1>
        <span className="meta-item">{fmtVersion(overview?.version)}</span>
        <span className="meta-item">{overview?.hostname ?? "–"}</span>
        <span className="meta-item">up {fmtUptime(overview?.uptimeSeconds)}</span>
      </div>
      <div className="overview-right">
        <div className="stat">
          <label>in</label>
          <b>{fmtRate(live.aggInRate)}</b>
        </div>
        <div className="stat">
          <label>out</label>
          <b>{fmtRate(live.aggOutRate)}</b>
        </div>
        <div className="stat">
          <label>processed</label>
          <b>{fmtCount(overview?.totals.receivedEvents)}</b>
        </div>
        <div className={`stat${(overview?.totals.errors ?? 0) > 0 ? " stat-error" : ""}`}>
          <label>errors</label>
          <b>{fmtCount(overview?.totals.errors)}</b>
        </div>
        <Sparkline data={live.history} />
      </div>
    </header>
  );
}

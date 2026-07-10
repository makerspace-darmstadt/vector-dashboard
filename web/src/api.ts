import type {
  ComponentConfig,
  Overview,
  Stats,
  Topology,
} from "../../shared/api-types";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchOverview = () => get<Overview>("/api/overview");
export const fetchTopology = () => get<Topology>("/api/topology");
export const fetchStats = () => get<Stats>("/api/stats");
export const fetchConfig = (id: string) =>
  get<ComponentConfig>(`/api/config/${encodeURIComponent(id)}`);

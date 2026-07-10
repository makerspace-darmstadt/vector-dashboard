import { env } from "../env.js";
import { getComponents, getMeta, type GrpcComponent } from "./client.js";

export interface Snapshot {
  ts: number;
  components: GrpcComponent[];
}

let snapshot: Snapshot | null = null;
let meta: { version: string; hostname: string } | null = null;
let lastSuccessTs = 0;
let lastErrorLogged = "";

async function pollOnce(): Promise<void> {
  try {
    const res = await getComponents();
    snapshot = { ts: Date.now(), components: res.components ?? [] };
    lastSuccessTs = snapshot.ts;
    lastErrorLogged = "";
    if (!meta) {
      meta = await getMeta();
      console.log(`connected to Vector ${meta.version} on ${meta.hostname}`);
    }
  } catch (err) {
    // Keep the last snapshot; freshness (isReachable) conveys the outage.
    // Re-fetch meta on recovery in case Vector was replaced/upgraded.
    meta = null;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg !== lastErrorLogged) {
      console.warn(`GetComponents failed: ${msg}`);
      lastErrorLogged = msg;
    }
  }
}

export function startPoller(): void {
  const loop = async () => {
    await pollOnce();
    setTimeout(loop, env.pollIntervalMs);
  };
  void loop();
}

export function getSnapshot(): Snapshot | null {
  return snapshot;
}

export function getMetaInfo(): { version: string; hostname: string } | null {
  return meta;
}

/** True if the last successful poll is recent enough to trust. */
export function isReachable(): boolean {
  return Date.now() - lastSuccessTs < env.pollIntervalMs * 2 + 2000;
}

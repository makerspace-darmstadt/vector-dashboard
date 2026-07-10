import { env } from "./env.js";

const HEALTH_INTERVAL_MS = 5000;
const HEALTH_TIMEOUT_MS = 2000;

let httpOk = false;

async function checkOnce(): Promise<void> {
  try {
    const res = await fetch(`${env.vectorHttpUrl}/health`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    const body = (await res.json()) as { ok?: boolean };
    httpOk = res.ok && body.ok === true;
  } catch {
    httpOk = false;
  }
}

export function startHealthPoller(): void {
  const loop = async () => {
    await checkOnce();
    setTimeout(loop, HEALTH_INTERVAL_MS);
  };
  void loop();
}

export function isVectorHealthy(): boolean {
  return httpOk;
}

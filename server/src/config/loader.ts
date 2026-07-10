import fs from "node:fs";
import { parse } from "yaml";
import { env } from "../env.js";

export interface ComponentDef {
  type?: string;
  inputs?: string[];
  [key: string]: unknown;
}

export interface VectorConfig {
  sources: Record<string, ComponentDef>;
  transforms: Record<string, ComponentDef>;
  sinks: Record<string, ComponentDef>;
}

let cache: { mtimeMs: number; config: VectorConfig } | null = null;
let lastErrorLogged = "";

/**
 * Reads and parses Vector's YAML config, cached on the file's mtime so
 * ConfigMap updates are picked up without a watcher. Returns null (and logs
 * once) if the file is missing or unparseable.
 */
export function loadVectorConfig(): VectorConfig | null {
  try {
    const { mtimeMs } = fs.statSync(env.vectorConfigPath);
    if (cache && cache.mtimeMs === mtimeMs) return cache.config;

    let raw = parse(fs.readFileSync(env.vectorConfigPath, "utf8")) as any;
    // Helm values files nest the actual Vector config under customConfig;
    // the rendered ConfigMap does not. Support both.
    if (raw && typeof raw === "object" && raw.customConfig) {
      raw = raw.customConfig;
    }
    const config: VectorConfig = {
      sources: raw?.sources ?? {},
      transforms: raw?.transforms ?? {},
      sinks: raw?.sinks ?? {},
    };
    cache = { mtimeMs, config };
    lastErrorLogged = "";
    return config;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg !== lastErrorLogged) {
      console.warn(`failed to load Vector config ${env.vectorConfigPath}: ${msg}`);
      lastErrorLogged = msg;
    }
    return cache?.config ?? null;
  }
}

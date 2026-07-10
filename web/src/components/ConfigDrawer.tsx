import { useEffect, useState } from "react";
import { stringify } from "yaml";
import type { ComponentConfig } from "../../../shared/api-types";
import { fetchConfig } from "../api";
import { getIcon } from "../icons";

interface Props {
  componentId: string;
  onClose: () => void;
}

export function ConfigDrawer({ componentId, onClose }: Props) {
  const [config, setConfig] = useState<ComponentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(null);
    setError(null);
    let cancelled = false;
    fetchConfig(componentId)
      .then((c) => !cancelled && setConfig(c))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [componentId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside className="drawer">
      <div className="drawer-head">
        {config && <span className="node-icon">{getIcon(config.type, config.kind)}</span>}
        <div className="drawer-title">
          <h2>{componentId}</h2>
          {config && (
            <span className="drawer-subtitle">
              {config.kind} · {config.type}
            </span>
          )}
        </div>
        <button className="drawer-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="drawer-body">
        {error && <p className="drawer-error">{error}</p>}
        {!error && !config && <p className="drawer-loading">Loading…</p>}
        {config && (
          <pre>{stringify(config.config, { blockQuote: "literal", lineWidth: 0 })}</pre>
        )}
      </div>
    </aside>
  );
}

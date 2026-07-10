import { useEffect, useRef, useState } from "react";

/**
 * Polls `fn` every `intervalMs`, pausing while the tab is hidden.
 * Failures keep the last value and set `stale`.
 */
export function usePoll<T>(fn: () => Promise<T>, intervalMs: number) {
  const [value, setValue] = useState<T | null>(null);
  const [stale, setStale] = useState(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = async () => {
      if (!document.hidden) {
        try {
          const v = await fnRef.current();
          if (cancelled) return;
          setValue(v);
          setStale(false);
        } catch {
          if (cancelled) return;
          setStale(true);
        }
      }
      timer = setTimeout(tick, intervalMs);
    };

    const onVisible = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        void tick();
      }
    };

    void tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return { value, stale };
}

const SECRET_KEY_RE =
  /password|passwd|token|secret|credential|auth|api_key|_key$|^key$|key_file|cert|crt/i;

const REDACTED = "***redacted***";

/**
 * Recursively replaces values whose key looks secret-ish. Intentionally
 * over-redacts (e.g. key_file paths) — acceptable for an internal tool;
 * raw values never leave the server.
 */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEY_RE.test(k) ? REDACTED : redact(v);
    }
    return out;
  }
  return value;
}

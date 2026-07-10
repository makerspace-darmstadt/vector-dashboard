# vector-dashboard

A lightweight web dashboard for a [Vector](https://vector.dev) instance, designed to run
as a sidecar container in the Vector pod.

```
Browser ⇄ Node.js sidecar (this repo) ⇄ Vector gRPC API (:8686) + Vector config file
```

It shows:

- **Overall health** — Vector's `/health` endpoint + gRPC reachability, version, hostname, uptime
- **Processed / error counts** — aggregate events in (sources) and out (sinks), cumulative error totals
- **The pipeline DAG** — interactive graph of sources → transforms → sinks with per-node live
  throughput, type icons, labeled route outputs; clicking a node shows its (redacted) configuration

## Why a sidecar server?

Vector ≥ ~0.50 replaced the GraphQL API with a native **gRPC** `ObservabilityService` on the API
port. Browsers can't speak native gRPC, so a small Node.js server polls Vector over gRPC and
serves the React UI plus a JSON API.

Two things are **not** exposed by Vector's gRPC API at all and are derived from Vector's YAML
config file instead (mount the same ConfigMap into the sidecar):

- the DAG edges (each component's `inputs`)
- per-component configuration (shown in the node drawer)

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `VECTOR_GRPC_ADDR` | `127.0.0.1:8686` | Vector API address (gRPC) |
| `VECTOR_HTTP_URL` | `http://$VECTOR_GRPC_ADDR` | Base URL for Vector's `/health` |
| `VECTOR_CONFIG_PATH` | *(required)* | Path to Vector's YAML config file |
| `PORT` | `8080` | Dashboard HTTP port |
| `POLL_INTERVAL_MS` | `2000` | gRPC `GetComponents` poll cadence |

The config loader also accepts a Helm values file with the config nested under `customConfig:`.
The file is re-read when its mtime changes, so ConfigMap updates are picked up automatically.

## Notes & limitations

- **"Errors" not "dropped":** Vector's gRPC API exposes `component_errors_total` but not
  `component_discarded_events_total`; the counter shown is errors. (True discarded counts are only
  available via an `internal_metrics` → `prometheus_exporter` pipeline.)
- **Redaction is key-based and intentionally over-broad** (`password`, `token`, `secret`, `auth`,
  `*_key`, `key_file`, `crt`, …). Certificate/key *paths* get redacted too — acceptable noise.
  Raw values never leave the server.
- **No authentication** on either the Vector API or this dashboard — deploy on trusted/internal
  networks only, matching Vector's own guidance for its API.
- Rates are computed client-side from counter deltas; a Vector restart (counter reset) shows a
  brief 0/s dip, then recovers.

## Development

Requires a running Vector with `api.enabled: true` (default `127.0.0.1:8686`).

```sh
npm install
VECTOR_CONFIG_PATH=/path/to/vector.yaml npm run dev
# server on :8080, Vite dev server on :5173 (proxies /api)
```

## Build & deploy

```sh
npm run build                   # tsc (server) + vite build (web)
task build-docker               # or: docker build -t vector-dashboard .
```

Releases are cut with `task release VERSION=x.y.z`, which bumps the package
versions, tags `vx.y.z`, and pushes; a GitHub Actions workflow then builds and
publishes `ghcr.io/makerspace-darmstadt/vector-dashboard:<version>` (and `:latest`).

See `k8s-sidecar-example.yaml` for wiring it into the Vector Helm chart
(`customConfig.api.enabled`, `extraContainers`, shared config volume).

## HTTP API

- `GET /api/overview` — health, version, uptime, aggregate totals
- `GET /api/topology` — nodes + edges derived from the config file, `live` flags from gRPC
- `GET /api/stats` — per-component cumulative counters (poll and diff for rates)
- `GET /api/config/:componentId` — redacted component config
- `GET /healthz` — sidecar's own liveness (always 200, independent of Vector)

## License

[MIT](LICENSE)

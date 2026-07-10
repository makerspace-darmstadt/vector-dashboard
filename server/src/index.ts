import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { env } from "./env.js";
import { startPoller } from "./grpc/poller.js";
import { startStreams } from "./grpc/streams.js";
import { startHealthPoller } from "./health.js";
import { api } from "./routes.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = process.env.WEB_DIST ?? path.resolve(here, "../../web/dist");

startPoller();
startStreams();
startHealthPoller();

const app = express();
app.disable("x-powered-by");

app.use("/api", api);

// The sidecar's own liveness probe — intentionally independent of Vector's state
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.use(express.static(WEB_DIST));
// SPA fallback
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  res.sendFile(path.join(WEB_DIST, "index.html"), (err) => {
    if (err) res.status(404).send("web UI not built");
  });
});

app.listen(env.port, () => {
  console.log(
    `vector-dashboard listening on :${env.port} (vector gRPC ${env.vectorGrpcAddr}, config ${env.vectorConfigPath})`
  );
});

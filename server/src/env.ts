const grpcAddr = process.env.VECTOR_GRPC_ADDR ?? "127.0.0.1:8686";

const configPath = process.env.VECTOR_CONFIG_PATH;
if (!configPath) {
  console.error(
    "VECTOR_CONFIG_PATH is required (path to Vector's YAML config, used for topology and per-component config)"
  );
  process.exit(1);
}

export const env = {
  vectorGrpcAddr: grpcAddr,
  vectorHttpUrl: process.env.VECTOR_HTTP_URL ?? `http://${grpcAddr}`,
  vectorConfigPath: configPath,
  port: Number(process.env.PORT ?? 8080),
  pollIntervalMs: Math.max(500, Number(process.env.POLL_INTERVAL_MS ?? 2000)),
};

import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { env } from "../env.js";

// dist/grpc/ (or src/grpc/ under tsx) -> repo root -> proto/
const here = path.dirname(fileURLToPath(import.meta.url));
const PROTO_DIR = process.env.PROTO_DIR ?? path.resolve(here, "../../../proto");

// proto-loader converts fields to camelCase; request fields must be camelCase
// too (e.g. intervalMs), enums are passed/returned as their string names.
const definition = protoLoader.loadSync("observability.proto", {
  includeDirs: [PROTO_DIR],
  longs: Number,
  enums: String,
  defaults: true,
});

const pkg = grpc.loadPackageDefinition(definition) as any;
const ObservabilityService = pkg.vector.observability.v1
  .ObservabilityService as grpc.ServiceClientConstructor;

export const client = new ObservabilityService(
  env.vectorGrpcAddr,
  grpc.credentials.createInsecure()
);

export type GrpcComponentType =
  | "COMPONENT_TYPE_UNSPECIFIED"
  | "COMPONENT_TYPE_SOURCE"
  | "COMPONENT_TYPE_TRANSFORM"
  | "COMPONENT_TYPE_SINK";

export interface GrpcComponent {
  componentId: string;
  componentType: GrpcComponentType;
  onType: string;
  outputs: { outputId: string; sentEventsTotal: number }[];
  metrics?: {
    receivedBytesTotal?: number;
    receivedEventsTotal?: number;
    sentBytesTotal?: number;
    sentEventsTotal?: number;
  };
}

const UNARY_DEADLINE_MS = 1500;

function unary<TReq, TRes>(method: string, request: TReq): Promise<TRes> {
  return new Promise((resolve, reject) => {
    (client as any)[method](
      request,
      { deadline: new Date(Date.now() + UNARY_DEADLINE_MS) },
      (err: grpc.ServiceError | null, res: TRes) =>
        err ? reject(err) : resolve(res)
    );
  });
}

export function getMeta(): Promise<{ version: string; hostname: string }> {
  return unary("getMeta", {});
}

export function getComponents(): Promise<{ components: GrpcComponent[] }> {
  return unary("getComponents", { limit: 0 });
}

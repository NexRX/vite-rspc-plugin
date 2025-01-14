import type { RPCConfig } from "../types.d.ts";
import { normalizePath } from "./file";

const DEFAULT_CONFIG = {
  client: {
    transport:
      import.meta?.env?.DEV ?? true ? "http://localhost:4000/rspc" : "/rspc",
  },
  func: {
    prefix: {
      query: "query",
      mutation: "mutate",
      subscription: "subscribeTo",
    },
    prefixDuplicatesOnly: true,
  },
};

// Exported to share the type with types.d.ts
export function resolvedConfig(config: RPCConfig) {
  if (!config) throw new Error("❌ Missing configuration object");
  if (!config.input)
    throw new Error(
      "❌ Missing input path, this needs to be the type file generated by RSPC"
    );
  if (!config.output)
    throw new Error(
      "❌ Missing output path, this is where the generated code will be written to"
    );

  const transportUrl =
    config.client?.transport || DEFAULT_CONFIG.client.transport;
  const transport = transportUrl.startsWith("/")
    ? `\`\${window.location.origin}${transportUrl}\``
    : `"${transportUrl}"`;
  return {
    ...DEFAULT_CONFIG,
    ...config,
    input: normalizePath(config.input),
    output: normalizePath(config.output),
    client: { ...DEFAULT_CONFIG.client, ...config.client, transport },
    func: { ...DEFAULT_CONFIG.func, ...config.func },
  };
}

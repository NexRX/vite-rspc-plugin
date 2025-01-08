import type { ClientArgs } from "@rspc/client";
import { resolvedConfig } from "./logic/config";

type RPCKind = "query" | "mutation" | "subscription";
type ConfigResolved = ReturnType<typeof resolvedConfig>;

/**
 * Configuration options for the RPC (Remote Procedure Call) system.
 */
interface RPCConfig {
  /**
   * The input file or directory for the RPC definitions.
   */
  input: string;

  /**
   * The output file or directory where the generated RPC code will be saved.
   */
  output: string;

  /**
   * Optional client configuration. Only the `transport` property has a default.
   */
  client?:
    | Omit<ClientArgs, "transport"> & {
        /**
         * The URL and path used for transporting RPC calls.
         * It can be one of the following:
         * - An absolute URL to the RPC server e.g. `'http://localhost:3000/rpsc'`
         * - A path relative to the current origin. Meaning '/rpc' would be equal to `window.location.origin + '/rspc'`
         * @default (import.meta?.env?.DEV ?? true) ? "http://localhost:4000/rspc" : "/rspc"
         */
        transport?: string;
      };

  /**
   * Optional function configuration.
   */
  func?: {
    /**
     * A record of prefixes for different RPC kinds.
     * @default { query: "query", mutation: "mutate", subscription: "subscribeTo" }
     */
    prefix?: {
      [K in RPCKind]?: string
    };

    /**
     * Whether to apply prefixes only to duplicate function names.
     * @default true
     */
    prefixDuplicatesOnly?: boolean;
  };
}

interface RPCTypeMetadata {
  /** Key or name of the RPC call */
  key: string;
  /** The input type for the RPC call if any input is required */
  input?: string;
  /** Whether the input type should be imported from the RPC file */
  importInput: boolean;
  /** The return type of the RPC call. Even if its nullish */
  result: string;
}
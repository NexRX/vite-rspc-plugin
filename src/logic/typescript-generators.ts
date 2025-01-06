import type { ConfigResolved, RPCKind, RPCTypeMetadata } from "../types";
import { RPC_METHODS } from "./rspc";
import { camelCase, capitalize } from "./strings";

export function generateFileContent(
  config: ConfigResolved,
  functions: string[]
): string {
  return `
  /* Auto-generated file - do not edit */
  /* eslint-disable */
  
  import type * as rpc from '${config.input}';
  import { createClient, FetchTransport, type Client } from "@rspc/client";
  
  ${generateClient(config)}
  
  ${functions.join("\n\n")}
  `;
}

export function generateFunctionName(
  key: string,
  kind: RPCKind,
  config: ConfigResolved,
  duplicates: string[]
): string {
  const prefix = duplicates.includes(key)
    ? config.func?.prefix?.[kind] || ""
    : "";
  return camelCase(prefix + key.split(".").map(capitalize).join(""));
}

export function generateFunction(
  name: string,
  kind: RPCKind,
  metadata: RPCTypeMetadata
): string {
  const jsDoc = generateJSDoc(metadata.key, kind, metadata);
  const inputParam = metadata.input
    ? `input: ${metadata.importInput ? "rpc." : ""}${metadata.input}`
    : "";

  return `${jsDoc}
  export function ${name}(${inputParam}) {
    return client.${RPC_METHODS[kind]}(["${metadata.key}"${
    inputParam ? ", input" : ""
  }]);
  }`;
}

export function generateJSDoc(
  key: string,
  kind: RPCKind,
  metadata: RPCTypeMetadata
): string {
  return `
  /** 
   * ${kind} RPC call to \`${key}\`
   * ${
     metadata.input
       ? `@param input {${metadata.importInput ? "rpc." : ""}${metadata.input}}`
       : "Takes no input"
   }
   * ${
     metadata.result === "null[]"
       ? "@returns {void}"
       : `@returns {${metadata.result}}`
   }
   */`;
}

export function generateClient(config: ConfigResolved) {
  return `
  // Generated Client and Config
  const transport = new FetchTransport(${config.client.transport});
  const clientConfig = {...${JSON.stringify({
    ...config.client,
    transport: undefined,
  })}, transport};
  export const client = createClient<rpc.Procedures>(clientConfig);`;
}

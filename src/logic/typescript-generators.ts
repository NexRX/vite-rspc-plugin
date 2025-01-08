import ts from "typescript";
import type { ConfigResolved, RPCKind, RPCTypeMetadata } from "../types";
import { RPC_METHODS, RPC_TYPE_KEYS } from "./rspc";
import { camelCase, capitalize } from "./strings";
import { extractTypeMetadata, isProceduresTypeAlias } from "./typescript-ast";

/** Entry point for generating all the RSPC function implementations in typescript  */
export function generateAllFunctions(
  config: ConfigResolved,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  duplicates: string[]
): string[] {
  return Object.keys(RPC_METHODS).flatMap((kind) =>
    generateFunctionsForKind(
      config,
      sourceFile,
      typeChecker,
      kind as RPCKind,
      duplicates
    )
  );
}

function generateFunctionsForKind(
  config: ConfigResolved,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  kind: RPCKind,
  duplicates: string[]
): string[] {
  const functions: string[] = [];

  function visit(node: ts.Node) {
    if (!isProceduresTypeAlias(node)) return;

    const type = typeChecker.getTypeAtLocation(node);
    const property = type.getProperty(RPC_TYPE_KEYS[kind]);
    if (!property) return;

    const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, node);
    if (!propertyType.isUnion()) return;

    propertyType.types.forEach((memberType) => {
      const metadata = extractTypeMetadata(memberType, typeChecker, node);
      const functionName = generateFunctionName(
        metadata.key,
        kind,
        config,
        duplicates
      );
      functions.push(generateFunction(functionName, kind, metadata));
    });
  }

  ts.forEachChild(sourceFile, visit);
  return functions;
}

// Actual AST Generation

export function generateFileContent(
  config: ConfigResolved,
  functions: string[]
): string {
  return `/* Auto-generated file - do not edit */
  /* eslint-disable */
  ${generateImports(config)}
  ${generateClient(config)}
  ${functions.join("\n\n")}
  `;
}

export function generateImports(config: ConfigResolved): string {
  return `
  import type * as rpc from '${config.input}';
  import { createClient, FetchTransport, type Client } from "@rspc/client";`;
}

export function generateFunctionName(
  key: string,
  kind: RPCKind,
  config: ConfigResolved,
  duplicates: string[]
): string {
  const prefix = duplicates.includes(key) || !config.func.prefixDuplicatesOnly
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

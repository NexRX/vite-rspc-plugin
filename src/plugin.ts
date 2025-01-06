import type { Plugin } from "vite";
import * as ts from "typescript";
import { normalizePath, writeOutputFile } from "./logic/file";
import { ConfigResolved, RPCConfig, RPCKind } from "./types";
import { findDuplicateRPCKeys, getAllRPCs } from "./logic/rspc";
import { generateFileContent, generateFunction, generateFunctionName } from "./logic/typescript-generators";
import { extractTypeMetadata, isProceduresTypeAlias } from "./logic/typescript-ast";

// Constants
const RPC_METHODS: Record<RPCKind, string> = {
  query: "query",
  mutation: "mutation",
  subscription: "subscription",
};

const RPC_TYPE_KEYS: Record<RPCKind, string> = {
  query: "queries",
  mutation: "mutations",
  subscription: "subscriptions",
};

const DEFAULT_CONFIG = {
  client: {
    transport: (import.meta?.env?.DEV ?? true) ? "http://localhost:4000/rspc" : "/rspc",
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

/**
 * Creates a Vite plugin for generating RPC (Remote Procedure Call) code.
 *
 * @param {RPCConfig} config - The configuration object for the RPC plugin.
 * @returns {Plugin} The configured Vite plugin.
 *
 * The plugin performs the following tasks:
 * - Resolves the provided configuration.
 * - Configures Vite with the resolved configuration.
 * - Generates RPC code at the start of the build process.
 * - Handles hot updates by regenerating the RPC code when changes are detected in `config.input`.
 */
export default function createRPCPlugin(config: RPCConfig): Plugin {
  const finalConfig: ConfigResolved = resolvedConfig(config);

  return {
    name: "vite-plugin-rspc",
    buildStart: () => generateRPC(finalConfig),
    handleHotUpdate: ({ file }) => {
      if (file.endsWith("backend-rpc.d.ts")) {
        console.log("Regenerating backend-rpc.ts");
        generateRPC(finalConfig);
      }
    },
  };
}

// Core functionality
function generateRPC(config: ConfigResolved) {
  const { sourceFile, typeChecker } = initializeTypeScript(config.input);
  const rpcs = getAllRPCs(sourceFile!, typeChecker);
  const duplicates = findDuplicateRPCKeys(rpcs);
  const functions = generateAllFunctions(
    config,
    sourceFile!,
    typeChecker,
    duplicates
  );

  writeOutputFile(config.output, generateFileContent(config, functions));
}

function generateAllFunctions(
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

function initializeTypeScript(inputPath: string) {
  const program = ts.createProgram([inputPath], {});
  const sourceFile = program.getSourceFile(inputPath);
  if (!sourceFile) throw new Error(`Input file not found: ${inputPath}`);

  return { sourceFile, typeChecker: program.getTypeChecker() };
}

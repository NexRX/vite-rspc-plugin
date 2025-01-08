import type { Plugin } from "vite";
import * as ts from "typescript";
import { writeOutputFile } from "./logic/file";
import type { ConfigResolved, RPCConfig } from "./types";
import { findDuplicateRPCKeys, getAllRPCs } from "./logic/rspc";
import {
  generateAllFunctions,
  generateFileContent,
} from "./logic/typescript-generators";
import { resolvedConfig } from "./logic/config";

/**
 * Creates a Vite plugin for generating RPC (Remote Procedure Call) code from RSPC.
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
export default function createRSPCPlugin(userConfig: RPCConfig): Plugin {
  const config: ConfigResolved = resolvedConfig(userConfig);

  return {
    name: "vite-rspc-plugin",
    buildStart: () => generateRPC(config),
    handleHotUpdate: ({ file }) => {
      if (file == config.input) generateRPC(config);
    },
  };
}

/** Core functionality, glues all the pieces together */
function generateRPC(config: ConfigResolved) {
  console.log("(Re-)generating backend-rpc.ts");
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

/** exported only for testing purposes */
export function initializeTypeScript(inputPath: string) {
  const program = ts.createProgram([inputPath], {});
  const sourceFile = program.getSourceFile(inputPath);
  if (!sourceFile) throw new Error(`Input file not found: ${inputPath}`);

  return { sourceFile, typeChecker: program.getTypeChecker() };
}

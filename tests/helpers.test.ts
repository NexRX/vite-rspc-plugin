import * as ts from "typescript";
import fs, { unlinkSync, writeFileSync } from "node:fs";
import tmp from "tmp";
import { expect, describe, it } from "vitest";
import { join } from "node:path";
import { initializeTypeScript } from "../src/plugin";
import { fail } from "node:assert";

// will crash without the increased memory limit in some cases
// process.env.NODE_OPTIONS = `--max-old-space-size=${1024 * 4} --expose-gc`;

const compilerOptions: ts.CompilerOptions = {
  noEmit: true,
  esModuleInterop: true,
  skipLibCheck: true,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, // Use Bundler resolution
  allowJs: true,
  resolveJsonModule: true,
  baseUrl: process.cwd(),
  isolatedModules: true,
  allowSyntheticDefaultImports: true,
  forceConsistentCasingInFileNames: true,
  paths: {
    "*": ["node_modules/*"], // Ensure node_modules packages can be found
  },
};

export function assertValidTypeScript(sourceCode: string) {
  // Create a temporary file to test the TypeScript code
  const tempFile = join(process.cwd(), "_temp.ts");
  writeFileSync(tempFile, sourceCode);

  // Create a custom compiler host
  const host = ts.createCompilerHost(compilerOptions);

  // Enhance module resolution
  const originalResolveModuleNames = host.resolveModuleNames;
  host.resolveModuleNames = (moduleNames, containingFile, ...args) => {
    return moduleNames.map((moduleName) => {
      // Try to resolve using default Node resolution
      if (originalResolveModuleNames) {
        const result = originalResolveModuleNames.call(
          host,
          [moduleName],
          containingFile,
          ...args
        );
        if (result[0]) return result[0];
      }

      // Fallback resolution for node_modules
      return ts.resolveModuleName(
        moduleName,
        containingFile,
        compilerOptions,
        host
      ).resolvedModule;
    });
  };

  // Create program with enhanced host
  const program = ts.createProgram({
    rootNames: [tempFile],
    options: compilerOptions,
    host,
  });

  // Get diagnostics
  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
    ...program.getGlobalDiagnostics(),
  ];

  // Clean up temporary file
  try {
    unlinkSync(tempFile);
  } catch (error) {
    if (!`${error}`.includes("no such file or directory"))
      console.error("Error cleaning up temporary file:", error);
  }

  // Format diagnostics
  const formattedDiagnostics = diagnostics.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      "\n"
    );
    return `${message} (TS${diagnostic.code})`;
  });

  // Cant expect in a way that prints errors to screen
  // because it will crash the suite sometimes

  if (formattedDiagnostics.length > 0) {
    const errorChars = 250;
    fail(
      `TypeScript code is invalid with ${formattedDiagnostics.length} total errors:\n` +
        `Source code generated: \n
        🟢======================🟢
        ${sourceCode}\n
        🔚======================🔚\n` +
        formattedDiagnostics
          .map(
            (v, i) =>
              `Error ${i}, first ${errorChars} characters:\n${v.slice(
                0,
                errorChars
              )}`
          )
          .join("\n")
    );
  }
  expect(diagnostics.length).toBe(0);
}

export function getFixture(fixture: string) {
  const filePath = join(__dirname, "__fixture__", fixture);
  return initializeTypeScript(filePath);
}

// Test cases
describe("isValidTypeScript", () => {
  it("should return true for valid TypeScript code", () => {
    const validCode = `
            const x: number = 10;
            function add(a: number, b: number): number {
                return a + b;
            }
        `;
    expect(() => assertValidTypeScript(validCode)).not.toThrow();
  });

  it("should throw an error for invalid TypeScript code", () => {
    const invalidCode = `
            const x: number = 'string';
            function add(a: number, b: number): number {
                return a + b;
            }
        `;
    expect(() => assertValidTypeScript(invalidCode)).toThrow();
  });

  it("should throw an error for syntax errors", () => {
    const syntaxErrorCode = `
            const x: number = 10
            function add(a: number, b: number): number {
                return a + b;
        `;
    expect(() => assertValidTypeScript(syntaxErrorCode)).toThrow();
  });
});

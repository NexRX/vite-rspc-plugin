import { describe, it, expect } from "vitest";
import {
  generateAllFunctions,
  generateFunctionName,
  generateFunction,
  generateJSDoc,
  generateClient,
  generateImports,
} from "../../src/logic/typescript-generators";
import { resolvedConfig } from "../../src/logic/config";
import { assertValidTypeScript, getFixture } from "../helpers.test";
import { ConfigResolved } from "../../src/types";

const exampleInput = "./tests/__fixture__/example.d.ts";

describe("generateAllFunctions", () => {
  it("should generate functions for all RPC kinds", () => {
    const config = resolvedConfig({ input: exampleInput, output: "output" });
    const { sourceFile, typeChecker } = getFixture("example.d.ts");
    const duplicates: string[] = [];

    const result = generateAllFunctions(
      config,
      sourceFile,
      typeChecker,
      duplicates
    );
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toEqual(3);

    assertValidTypeScript(withImportsAndClient(config, result.join("\n")));
  });
});

describe("generateFunctionName", () => {
  it("should generate a camelCase function name", () => {
    const config = resolvedConfig({ input: "input", output: "output" });
    const result = generateFunctionName("test.key", "query", config, []);
    expect(result).toBe("testKey");
  });

  it("should generate a function name without prefix when other duplicates", () => {
    const config = resolvedConfig({ input: "input", output: "output" });
    const result = generateFunctionName("test.key", "query", config, [
      "test.k3y",
    ]);
    expect(result).toBe("testKey");
  });

  it("should generate a function name with prefix when duplicate", () => {
    const config = resolvedConfig({ input: "input", output: "output" });
    const result = generateFunctionName("test.key", "query", config, [
      "test.key",
    ]);
    expect(result).toBe("queryTestKey");
  });

  it("should generate a function name with prefix when configured to", () => {
    const config = resolvedConfig({
      input: "input",
      output: "output",
      func: { prefixDuplicatesOnly: false },
    });
    const result = generateFunctionName("test.key", "query", config, []);
    expect(result).toBe("queryTestKey");
  });
});

describe("generateFunction", () => {
  it("should generate a valid function with procedure", () => {
    const metadata = {
      key: "user.list", // from example.d.ts
      input: undefined as any, // from example.d.ts
      importInput: false,
      result: "void",
    };
    const result = generateFunction("testFunction", "query", metadata);
    expect(result).toContain("export function testFunction");

    const config = resolvedConfig({ input: exampleInput, output: "output" });
    assertValidTypeScript(withImportsAndClient(config, result));
  });
});

describe("generateJSDoc", () => {
  it("should generate JSDoc comment", () => {
    const metadata = {
      key: "test.key",
      input: "string",
      importInput: false,
      result: "void",
    };
    const result = generateJSDoc("test.key", "query", metadata);
    expect(result).toContain("* query RPC call to `test.key`");
    assertValidTypeScript(result);
  });
});

describe("generateClient", () => {
  it("should generate client configuration", () => {
    const config = resolvedConfig({ input: exampleInput, output: "output" });
    const result = generateClient(config);
    expect(result).toContain(
      "export const client = createClient<rpc.Procedures>("
    );

    assertValidTypeScript(withImports(config, result));
  });
});


function withImports(config: ConfigResolved, result: string) {
  return [generateImports(config), result].join("\n")
}

function withImportsAndClient(config: ConfigResolved, result: string) {
  return [generateImports(config), generateClient(config), result].join("\n")
}
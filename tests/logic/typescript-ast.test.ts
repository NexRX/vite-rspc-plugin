import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import {
  isProceduresTypeAlias,
  extractTypeMetadata,
  isNeverType,
  isCustomType,
  getTypeString,
} from "../../src/logic/typescript-ast";
import { RPC_TYPE_KEYS } from "../../src/logic/rspc";
import { fail } from "assert";
import { RPCTypeMetadata } from "../../src/types";
import { getFixture } from "../helpers.test";

describe("isProceduresTypeAlias", () => {
  it("should return true for Procedures type alias", () => {
    const node = ts.factory.createTypeAliasDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      "Procedures",
      undefined,
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    );
    expect(isProceduresTypeAlias(node)).toBe(true);
  });

  it("should return false for non-Procedures type alias", () => {
    const node = ts.factory.createTypeAliasDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      "NotProcedures",
      undefined,
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    );
    expect(isProceduresTypeAlias(node)).toBe(false);
  });
});

describe("extractTypeMetadata", () => {
  /** Test bench for extractTypeMetadata
   * @returns number of RPCs found */
  function testMeta(fixture: string, test: (meta: RPCTypeMetadata) => void) {
    const { sourceFile, typeChecker } = getFixture(fixture);
    let numberOfRpcs = 0;

    ts.forEachChild(sourceFile, (node) => {
      // Setup
      if (!isProceduresTypeAlias(node)) return;
      const type = typeChecker.getTypeAtLocation(node);
      const property = type.getProperty(RPC_TYPE_KEYS["query"]);
      if (!property) fail("Expected property");
      const propertyType = typeChecker.getTypeOfSymbolAtLocation(
        property,
        node
      );
      if (!propertyType.isUnion()) return;

      // Assertions
      propertyType.types.forEach((memberType) => {
        const metadata = extractTypeMetadata(memberType, typeChecker, node);
        test(metadata);
        numberOfRpcs += 1;
      });
    });

    return numberOfRpcs;
  }

  it("should extract metadata from type", () => {
    const numberOfRpcs = testMeta("example.d.ts", (meta) => {
      expect(meta).toHaveProperty("key");
      expect(meta).toHaveProperty("input");
      expect(meta).toHaveProperty("importInput");
      expect(meta).toHaveProperty("result");
    });
    expect(numberOfRpcs).toEqual(3);
  });
});

describe("isNeverType", () => {
  it("should return true for never type", () => {
    const typeChecker = ts.createProgram([], {}).getTypeChecker();
    const neverType = typeChecker.getNeverType();
    expect(isNeverType(neverType)).toBe(true);
  });

  it("should return false for non-never type", () => {
    const typeChecker = ts.createProgram([], {}).getTypeChecker();
    const stringType = typeChecker.getStringType();
    expect(isNeverType(stringType)).toBe(false);
  });
});

describe("isCustomType", () => {
  it("should return true for custom type", () => {
    expect(isCustomType("CustomType")).toBe(true);
  });

  it("should return false for built-in type", () => {
    expect(isCustomType("string")).toBe(false);
  });
});

describe("getTypeString", () => {
  it("should return string representation of type", () => {
    const typeChecker = ts.createProgram([], {}).getTypeChecker();
    const stringType = typeChecker.getStringType();
    expect(getTypeString(stringType, typeChecker)).toBe("string");
  });
});

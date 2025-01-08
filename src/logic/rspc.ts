import type { RPCKind } from "../types.d.ts";
import { isProceduresTypeAlias, getPropertyType } from "./typescript-ast";
import * as ts from "typescript";

// Constants
export const RPC_METHODS: Record<RPCKind, string> = {
  query: "query",
  mutation: "mutation",
  subscription: "subscription",
};

export const RPC_TYPE_KEYS: Record<RPCKind, string> = {
  query: "queries",
  mutation: "mutations",
  subscription: "subscriptions",
};


export function getAllRPCs(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
) {
  return {
    queries: extractRPCs(sourceFile, typeChecker, "query"),
    mutations: extractRPCs(sourceFile, typeChecker, "mutation"),
    subscriptions: extractRPCs(sourceFile, typeChecker, "subscription"),
  };
}

export function extractRPCs(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
  kind: keyof typeof RPC_TYPE_KEYS
): string[] {
  const rpcKeys: string[] = [];

  function visit(node: ts.Node) {
    if (!isProceduresTypeAlias(node)) return;

    const type = typeChecker.getTypeAtLocation(node);
    const property = type.getProperty(kind);
    if (!property) return;

    const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, node);
    if (!propertyType.isUnion()) return;

    propertyType.types.forEach((memberType) => {
      const keyType = getPropertyType(memberType, "key", typeChecker, node);
      if (keyType?.isStringLiteral()) rpcKeys.push(keyType.value);
    });
  }

  ts.forEachChild(node, visit);
  return rpcKeys;
}

export function findDuplicateRPCKeys(rpcs: Record<string, string[]>): string[] {
  const allKeys = Object.values(rpcs).flat();
  return [
    ...new Set(
      allKeys.filter((key) => allKeys.filter((k) => k === key).length > 1)
    ),
  ];
}

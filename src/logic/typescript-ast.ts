import * as ts from "typescript";
import type { RPCTypeMetadata } from "../types.d.ts";

/** Type guard and metadata extraction */
export function isProceduresTypeAlias(
  node: ts.Node
): node is ts.TypeAliasDeclaration {
  return ts.isTypeAliasDeclaration(node) && node.name.text === "Procedures";
}

export function getPropertyType(
  type: ts.Type,
  propertyName: string,
  typeChecker: ts.TypeChecker,
  node: ts.Node
): ts.Type | undefined {
  const property = type.getProperty(propertyName);
  return property
    ? typeChecker.getTypeOfSymbolAtLocation(property, node)
    : undefined;
}

export function extractTypeMetadata(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node
): RPCTypeMetadata {
  const keyType = getPropertyType(
    type,
    "key",
    typeChecker,
    node
  ) as ts.StringLiteralType;
  const inputType = getPropertyType(type, "input", typeChecker, node);
  const resultType = getPropertyType(type, "result", typeChecker, node);

  const input =
    inputType && !isNeverType(inputType)
      ? getTypeString(inputType, typeChecker)
      : undefined;

  return {
    key: keyType.value,
    input,
    importInput: isCustomType(input),
    result: getTypeString(resultType!, typeChecker),
  };
}

export function isNeverType(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Never) !== 0;
}

export function isCustomType(type?: string): boolean {
  if (!type) return false;
  const builtInTypes = [
    "string",
    "number",
    "boolean",
    "undefined",
    "null",
    "object",
    "symbol",
    "bigint",
  ];
  return !builtInTypes.includes(type);
}

export function getTypeString(
  type: ts.Type,
  typeChecker: ts.TypeChecker
): string {
  if (type.flags & ts.TypeFlags.StringLiteral)
    return `"${(type as ts.StringLiteralType).value}"`;
  if (type.flags & ts.TypeFlags.NumberLiteral)
    return (type as ts.NumberLiteralType).value.toString();
  if (type.flags & ts.TypeFlags.BooleanLiteral) return "boolean";
  if (type.isUnion())
    return type.types.map((t) => getTypeString(t, typeChecker)).join(" | ");
  return typeChecker.typeToString(type);
}

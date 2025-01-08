import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { getAllRPCs, extractRPCs, findDuplicateRPCKeys } from '../../src/logic/rspc';

describe('getAllRPCs', () => {
  it('should extract all RPCs from source file', () => {
    const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
    const typeChecker = ts.createProgram([], {}).getTypeChecker();
    const result = getAllRPCs(sourceFile, typeChecker);
    expect(result).toHaveProperty('queries');
    expect(result).toHaveProperty('mutations');
    expect(result).toHaveProperty('subscriptions');
  });
});

describe('extractRPCs', () => {
  it('should extract RPC keys of specified kind', () => {
    const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
    const typeChecker = ts.createProgram([], {}).getTypeChecker();
    const result = extractRPCs(sourceFile, typeChecker, 'query');
    expect(result).toBeInstanceOf(Array);
  });
});

describe('findDuplicateRPCKeys', () => {
  it('should find duplicate RPC keys', () => {
    const rpcs = {
      queries: ['key1', 'key2'],
      mutations: ['key2', 'key3'],
      subscriptions: ['key1', 'key4'],
    };
    const result = findDuplicateRPCKeys(rpcs);
    expect(result).toEqual(['key1', 'key2']);
  });
});

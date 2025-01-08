import { describe, it, expect } from 'vitest';
import { camelCase, capitalize } from '../../src/logic/strings';

describe('camelCase', () => {
  it('should convert string to camelCase', () => {
    expect(camelCase('hello world')).toBe('helloWorld');
  });
});

describe('capitalize', () => {
  it('should capitalize the first letter of the string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });
});

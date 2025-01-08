import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import { normalizePath, writeOutputFile } from '../../src/logic/file';

vi.mock('node:fs');

describe('normalizePath', () => {
  it('should normalize relative path', () => {
    const result = normalizePath('./relative/path');
    expect(result).toContain('/relative/path');
  });

  it('should return absolute path as is', () => {
    const result = normalizePath('/absolute/path');
    expect(result).toBe('/absolute/path');
  });
});

describe('writeOutputFile', () => {
  it('should write content to file', () => {
    writeOutputFile('/path/to/file', 'content');
    expect(fs.writeFileSync).toHaveBeenCalledWith('/path/to/file', 'content', {
      encoding: 'utf-8',
      flush: true,
    });
  });
});

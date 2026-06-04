import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PackageJsonError, readPackageJson } from '../../src/lib/readPackageJson.js';

describe('readPackageJson', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unmaintained-readpkg-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const writePkg = async (contents: string): Promise<void> => {
    await fs.writeFile(path.join(tempDir, 'package.json'), contents, 'utf8');
  };

  it('should read and parse a valid package.json', async () => {
    await writePkg(JSON.stringify({ name: 'demo', dependencies: { chalk: '^5.6.2' } }));
    expect(await readPackageJson(tempDir)).toEqual({
      name: 'demo',
      dependencies: { chalk: '^5.6.2' },
    });
  });

  it('should throw PackageJsonError when package.json is missing', async () => {
    await expect(readPackageJson(tempDir)).rejects.toBeInstanceOf(PackageJsonError);
  });

  it('should throw PackageJsonError when package.json is invalid JSON', async () => {
    await writePkg('{ not valid json');
    await expect(readPackageJson(tempDir)).rejects.toBeInstanceOf(PackageJsonError);
  });
});

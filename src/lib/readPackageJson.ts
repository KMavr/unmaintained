import fs from 'node:fs/promises';
import path from 'node:path';
import { PackageJson } from '../types.js';

export class PackageJsonError extends Error {}

export const readPackageJson = async (cwd: string): Promise<PackageJson> => {
  const packageJsonPath = path.join(cwd, 'package.json');

  let raw: string;
  try {
    raw = await fs.readFile(packageJsonPath, 'utf8');
  } catch {
    throw new PackageJsonError(`No package.json found at ${packageJsonPath}`);
  }

  try {
    return JSON.parse(raw);
  } catch (parseError) {
    throw new PackageJsonError(
      `Failed to parse ${packageJsonPath}: ${(parseError as Error).message}`,
    );
  }
};

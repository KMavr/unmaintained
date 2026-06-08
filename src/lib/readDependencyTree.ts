import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DependencyNode } from '../types.js';

const run = promisify(execFile);

export class DependencyTreeError extends Error {}

export const readDependencyTree = async (
  cwd: string,
  production: boolean,
): Promise<DependencyNode> => {
  const args = ['ls', '--json', '--all', ...(production ? ['--omit=dev'] : [])];

  let stdout: string | undefined;
  try {
    ({ stdout } = await run('npm', args, { cwd, maxBuffer: 64 * 1024 * 1024 }));
  } catch (error) {
    stdout = (error as { stdout?: string }).stdout;
  }

  if (!stdout) {
    throw new DependencyTreeError(
      `Could not read the dependency tree in ${cwd}. Are dependencies installed (node_modules present)?`,
    );
  }

  try {
    return JSON.parse(stdout);
  } catch (parseError) {
    throw new DependencyTreeError(
      `Failed to parse "npm ls" output: ${(parseError as Error).message}`,
    );
  }
};

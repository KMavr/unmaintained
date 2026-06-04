import type { RunOptions } from './types.js';

async function run(options: RunOptions): Promise<number> {
  console.log(`unmaintained: would scan ${options.cwd} (not yet implemented)`);
  return 0;
}

export { run };

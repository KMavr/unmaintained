#!/usr/bin/env node
import { createRequire } from 'node:module';
import { Command } from 'commander';
import { run } from './run.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const program = new Command();

program
  .name('unmaintained')
  .description(
    'Report which of your dependencies are unmaintained, and which are probably unmaintained',
  )
  .version(pkg.version)
  .argument('[path]', 'project directory to scan', '.')
  .option('--strict', 'exit non-zero when any unmaintained (hard-signal) packages are found', false)
  .option('--soft', 'also report the "probably unmaintained" tier from heuristic signals', false)
  .option('--transitive', 'scan the full dependency tree, not just direct dependencies', false)
  .option('--depth <n>', 'limit transitive scanning to this depth', (v) => Number.parseInt(v, 10))
  .option('--production', 'scan only "dependencies" (skip devDependencies)', false)
  .option('--json', 'emit machine-readable JSON; suppress human output', false)
  .option('--token <token>', 'GitHub token for higher rate limits (or set GITHUB_TOKEN)')
  .action(async (path: string, options) => {
    process.exitCode = await run({
      cwd: path,
      strict: options.strict,
      soft: options.soft,
      transitive: options.transitive,
      depth: options.depth,
      production: options.production,
      json: options.json,
      token: options.token ?? process.env.GITHUB_TOKEN,
    });
  });

program.parseAsync();

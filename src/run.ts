import chalk from 'chalk';
import { analyze } from './analyze.js';
import { directDependencies } from './lib/directDependencies.js';
import type { DirectDependency } from './lib/directDependencies.js';
import { PackageJsonError, readPackageJson } from './lib/readPackageJson.js';
import { renderHuman } from './report/renderHuman.js';
import { renderJson } from './report/renderJson.js';
import { createDefaultSources } from './sources/index.js';
import type { RunOptions } from './types.js';

async function run(options: RunOptions): Promise<number> {
  try {
    const packageJson = await readPackageJson(options.cwd);
    const dependencies = directDependencies(packageJson, !options.production);
    const { sources, diagnostics } = createDefaultSources(options.token);
    const data = await sources.fetchPackages(dependencies.map((dep) => dep.name));
    const findings = dependencies.map((dep: DirectDependency, i: number) =>
      analyze(dep, data[i], options.soft),
    );

    console.log(options.json ? renderJson(findings) : renderHuman(findings));

    if (diagnostics.gitHubRateLimited > 0) {
      console.error(
        chalk.yellow(
          `⚠ GitHub rate limit reached — archived/topic status is unknown for ${diagnostics.gitHubRateLimited} package(s). ` +
            `Set GITHUB_TOKEN to raise the limit (60 → 5000 requests/hour).`,
        ),
      );
    }

    return options.strict && findings.some((f) => f.tier === 'unmaintained') ? 1 : 0;
  } catch (error) {
    if (error instanceof PackageJsonError) {
      console.error(error.message);
      return 2;
    }
    throw error;
  }
}

export default run;

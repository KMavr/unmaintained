import { analyze } from './analyze.js';
import { directDependencies } from './lib/directDependencies.js';
import type { DirectDependency } from './lib/directDependencies.js';
import { PackageJsonError, readPackageJson } from './lib/readPackageJson.js';
import { renderHuman } from './report/renderHuman.js';
import { createDefaultSources } from './sources/index.js';
import type { RunOptions } from './types.js';

async function run(options: RunOptions): Promise<number> {
  try {
    const packageJson = await readPackageJson(options.cwd);
    const dependencies = directDependencies(packageJson, !options.production);
    const defaultSources = createDefaultSources(options.token);
    const findings = await Promise.all(
      dependencies.map((dep: DirectDependency) => analyze(dep, defaultSources, options.soft)),
    );

    console.log(renderHuman(findings));

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

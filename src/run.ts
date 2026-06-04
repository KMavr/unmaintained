import { directDependencies } from './lib/directDependencies.js';
import type { DirectDependency } from './lib/directDependencies.js';
import { PackageJsonError, readPackageJson } from './lib/readPackageJson.js';
import type { RunOptions } from './types.js';

async function run(options: RunOptions): Promise<number> {
  try {
    const packageJson = await readPackageJson(options.cwd);
    const dependencies = directDependencies(packageJson, !options.production);

    console.log(
      `Found ${dependencies.length} direct ${dependencies.length === 1 ? 'dependency' : 'dependencies'} to check:`,
    );
    dependencies.forEach((dep: DirectDependency) => {
      console.log(`  ${dep.name}@${dep.range}${dep.dev ? ' (dev)' : ''}`);
    });
    return 0;
  } catch (error) {
    if (error instanceof PackageJsonError) {
      console.error(error.message);
      return 2;
    }
    throw error;
  }
}

export { run };

import { PackageJson } from '../types.js';

export interface DirectDependency {
  name: string;
  range: string;
  dev: boolean;
}

export const directDependencies = (pkg: PackageJson, includeDev: boolean): DirectDependency[] => {
  const dependencies = Object.entries(pkg?.dependencies ?? {}).map(([name, range]) => ({
    name,
    range,
    dev: false,
  }));

  const devDependencies = includeDev
    ? Object.entries(pkg?.devDependencies ?? {}).map(([name, range]) => ({
        name,
        range,
        dev: true,
      }))
    : [];

  return [...dependencies, ...devDependencies];
};

import { archivedCheck } from './checks/hard/archived.js';
import { deprecatedCheck } from './checks/hard/deprecated.js';
import type { DirectDependency } from './lib/directDependencies.js';
import type { Finding, Reason, Sources } from './types.js';

const HARD_CHECKS = [deprecatedCheck, archivedCheck];

export const analyze = async (dep: DirectDependency, sources: Sources): Promise<Finding> => {
  const data = await sources.fetchPackage(dep.name);

  const reasons = HARD_CHECKS.map((check) => check(data)).filter(
    (reason): reason is Reason => reason !== null,
  );

  return {
    name: dep.name,
    version: data.latestVersion ?? dep.range,
    tier: reasons.length > 0 ? 'unmaintained' : 'maintained',
    reasons,
  };
};

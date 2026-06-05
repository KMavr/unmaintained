import { archivedCheck } from './checks/hard/archived.js';
import { deprecatedCheck } from './checks/hard/deprecated.js';
import { unmaintainedTopicCheck } from './checks/hard/unmaintainedTopic.js';
import { commitAgeCheck } from './checks/soft/commitAge.js';
import { releaseCadenceCheck } from './checks/soft/releaseCadence.js';
import { soloMaintainerCheck } from './checks/soft/soloMaintainer.js';
import { staleIssuesCheck } from './checks/soft/staleIssues.js';
import type { DirectDependency } from './lib/directDependencies.js';
import type { Finding, PackageData, Reason, Tier } from './types.js';

const HARD_CHECKS = [deprecatedCheck, archivedCheck, unmaintainedTopicCheck];
const SOFT_CHECKS = [releaseCadenceCheck, soloMaintainerCheck, commitAgeCheck, staleIssuesCheck];

const getTier = (hardReasonsLength: number, softReasonsLength: number): Tier => {
  if (hardReasonsLength > 0) {
    return 'unmaintained';
  }
  if (softReasonsLength > 0) {
    return 'probably';
  }
  return 'maintained';
};

const isValidReason = (reason: Reason | null): reason is Reason => reason !== null;

export const analyze = (
  dep: DirectDependency,
  data: PackageData,
  soft: boolean = false,
  now: Date = new Date(),
): Finding => {
  const hardReasons = HARD_CHECKS.map((check) => check(data)).filter(isValidReason);

  const softReasons = soft
    ? SOFT_CHECKS.map((check) => check(data, now)).filter(isValidReason)
    : [];

  return {
    name: dep.name,
    version: data.latestVersion ?? dep.range,
    tier: getTier(hardReasons.length, softReasons.length),
    reasons: [...hardReasons, ...softReasons],
  };
};

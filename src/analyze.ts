import { archivedCheck } from './checks/hard/archived.js';
import { deprecatedCheck } from './checks/hard/deprecated.js';
import { unmaintainedTopicCheck } from './checks/hard/unmaintainedTopic.js';
import { releaseCadenceCheck } from './checks/soft/releaseCadence.js';
import type { DirectDependency } from './lib/directDependencies.js';
import type { Finding, Reason, Sources, Tier } from './types.js';

const HARD_CHECKS = [deprecatedCheck, archivedCheck, unmaintainedTopicCheck];
const SOFT_CHECKS = [releaseCadenceCheck];

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

export const analyze = async (
  dep: DirectDependency,
  sources: Sources,
  soft: boolean = false,
  now: Date = new Date(),
): Promise<Finding> => {
  const data = await sources.fetchPackage(dep.name);

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

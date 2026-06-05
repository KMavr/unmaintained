import { DEFAULT_THRESHOLDS } from '../../config.js';
import { PackageData, Reason } from '../../types.js';

export const commitAgeCheck = (
  data: PackageData,
  now: Date,
  commitAgeYears: number = DEFAULT_THRESHOLDS.commitAgeYears,
): Reason | null => {
  if (!data.lastCommit) {
    return null;
  }

  const pushed = new Date(data.lastCommit);
  const ageYears = (now.getTime() - pushed.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (ageYears < commitAgeYears) {
    return null;
  }

  return {
    check: 'commit-age',
    detail: `${data.name}'s repository has had no commits for ${ageYears.toFixed(1)} years (last push ${data.lastCommit}).`,
    confidence: 'soft',
  };
};

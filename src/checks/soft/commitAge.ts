import { DEFAULT_THRESHOLDS } from '../../config.js';
import { YEAR_MS } from '../../constants.js';
import { Reason, SoftCheckInput } from '../../types.js';

export const commitAgeCheck = ({
  data,
  now = new Date(),
  thresholds = DEFAULT_THRESHOLDS,
}: SoftCheckInput): Reason | null => {
  if (!data.lastCommit) {
    return null;
  }

  const pushed = new Date(data.lastCommit);
  const ageYears = (now.getTime() - pushed.getTime()) / YEAR_MS;

  if (ageYears < thresholds.commitAgeYears) {
    return null;
  }

  return {
    check: 'commit-age',
    detail: `${data.name}'s repository has had no commits for ${ageYears.toFixed(1)} years (last push ${data.lastCommit}).`,
    confidence: 'soft',
  };
};

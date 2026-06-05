import { DEFAULT_THRESHOLDS } from '../../config.js';
import { YEAR_MS } from '../../constants.js';
import { PackageData, Reason } from '../../types.js';

export const releaseCadenceCheck = (
  data: PackageData,
  now: Date,
  cadenceYears: number = DEFAULT_THRESHOLDS.cadenceYears,
): Reason | null => {
  if (!data.lastPublish) {
    return null;
  }

  const published = new Date(data.lastPublish);
  const ageYears = (now.getTime() - published.getTime()) / YEAR_MS;
  if (ageYears < cadenceYears) {
    return null;
  }

  return {
    check: 'cadence',
    detail: `${data.name}'s last release was ${ageYears.toFixed(1)} years ago (${data.lastPublish}).`,
    confidence: 'soft',
  };
};

import { PackageData, Reason } from '../../types.js';

export const deprecatedCheck = (data: PackageData): Reason | null => {
  if (data.deprecated) {
    return {
      check: 'deprecated',
      detail: `${data.name} is flagged deprecated in its latest version ${data.latestVersion}.`,
      confidence: 'hard',
    };
  }
  return null;
};

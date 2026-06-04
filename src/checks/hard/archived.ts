import { PackageData, Reason } from '../../types.js';

export const archivedCheck = (data: PackageData): Reason | null => {
  if (data.archived) {
    return {
      check: 'archived',
      detail: `${data.name} is flagged archived.`,
      confidence: 'hard',
    };
  }

  return null;
};

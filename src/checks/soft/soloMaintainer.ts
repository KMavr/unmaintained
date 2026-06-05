import { PackageData, Reason } from '../../types.js';

export const soloMaintainerCheck = (data: PackageData): Reason | null => {
  if (data.maintainerCount !== 1) {
    return null;
  }

  return {
    check: 'solo-maintainer',
    detail: `${data.name} has a single npm maintainer. Common in open source, but a higher bus-factor risk than projects with several.`,
    confidence: 'soft',
  };
};

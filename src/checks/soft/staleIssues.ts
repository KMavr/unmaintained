import { DEFAULT_THRESHOLDS } from '../../config.js';
import { MONTH_MS } from '../../constants.js';
import { Reason, SoftCheckInput } from '../../types.js';

export const staleIssuesCheck = ({
  data,
  now = new Date(),
  thresholds = DEFAULT_THRESHOLDS,
}: SoftCheckInput): Reason | null => {
  if (data.openIssues === null || data.closedIssues === null || data.repoCreatedAt === null) {
    return null;
  }

  const ageMonths = (now.getTime() - new Date(data.repoCreatedAt).getTime()) / MONTH_MS;
  if (ageMonths < thresholds.staleIssuesMinAgeMonths) {
    return null;
  }

  const total = data.openIssues + data.closedIssues;
  if (total < thresholds.staleIssuesFloor) {
    return null;
  }

  const openRatio = data.openIssues / total;
  if (openRatio < thresholds.staleIssueRatio) {
    return null;
  }

  return {
    check: 'stale-issues',
    detail: `${data.name} has ${data.openIssues} of ${total} issues still open (${Math.round(openRatio * 100)}%), suggesting an unattended backlog.`,
    confidence: 'soft',
  };
};

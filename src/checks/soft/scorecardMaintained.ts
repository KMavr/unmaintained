import { DEFAULT_THRESHOLDS } from '../../config.js';
import { Reason, SoftCheckInput } from '../../types.js';

export const scorecardMaintainedCheck = ({
  data,
  thresholds = DEFAULT_THRESHOLDS,
}: SoftCheckInput): Reason | null => {
  if (data.scorecardMaintained === null) {
    return null;
  }

  if (data.scorecardMaintained > thresholds.scorecardMaintainedFloor) {
    return null;
  }

  return {
    check: 'scorecard-maintained',
    detail: `${data.name} scores ${data.scorecardMaintained}/10 on the OpenSSF Scorecard "Maintained" check (recent commit and issue activity), at or below the ${thresholds?.scorecardMaintainedFloor}/10 floor.`,
    confidence: 'soft',
  };
};

import { describe, expect, it } from 'vitest';
import { scorecardMaintainedCheck } from '../../src/checks/soft/scorecardMaintained.js';
import { DEFAULT_THRESHOLDS } from '../../src/config.js';
import type { PackageData } from '../../src/types.js';

const base: PackageData = {
  name: 'left-pad',
  latestVersion: '1.3.0',
  deprecated: null,
  repositoryUrl: 'https://github.com/foo/bar',
  archived: false,
  topics: [],
  lastPublish: null,
  maintainerCount: null,
  lastCommit: null,
  openIssues: null,
  closedIssues: null,
  repoCreatedAt: null,
  scorecardMaintained: null,
};

const now = new Date('2026-06-05T00:00:00Z');

describe('scorecardMaintainedCheck', () => {
  it('should flag a package whose Maintained score is below the floor', () => {
    const reason = scorecardMaintainedCheck({ data: { ...base, scorecardMaintained: 0 }, now });
    expect(reason).toMatchObject({ check: 'scorecard-maintained', confidence: 'soft' });
    expect(reason?.detail).toContain('left-pad');
  });

  it('should flag a package whose Maintained score sits exactly on the floor', () => {
    const reason = scorecardMaintainedCheck({ data: { ...base, scorecardMaintained: 2 }, now });
    expect(reason).toMatchObject({ check: 'scorecard-maintained', confidence: 'soft' });
  });

  it('should return null for a package scoring above the floor', () => {
    expect(scorecardMaintainedCheck({ data: { ...base, scorecardMaintained: 8 }, now })).toBeNull();
  });

  it('should return null when there is no Maintained score', () => {
    expect(
      scorecardMaintainedCheck({ data: { ...base, scorecardMaintained: null }, now }),
    ).toBeNull();
  });

  it('should respect an explicit floor override', () => {
    const reason = scorecardMaintainedCheck({
      data: { ...base, scorecardMaintained: 5 },
      now,
      thresholds: { ...DEFAULT_THRESHOLDS, scorecardMaintainedFloor: 5 },
    });
    expect(reason).toMatchObject({ check: 'scorecard-maintained', confidence: 'soft' });
  });
});

import { describe, expect, it } from 'vitest';
import { commitAgeCheck } from '../../src/checks/soft/commitAge.js';
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
};

const now = new Date('2026-06-05T00:00:00Z');

describe('commitAgeCheck', () => {
  it('should flag a repository whose last push is older than the threshold', () => {
    const reason = commitAgeCheck({ data: { ...base, lastCommit: '2022-01-01T00:00:00Z' }, now });
    expect(reason).toMatchObject({ check: 'commit-age', confidence: 'soft' });
    expect(reason?.detail).toContain('2022-01-01');
  });

  it('should return null for a repository pushed within the threshold', () => {
    expect(
      commitAgeCheck({ data: { ...base, lastCommit: '2025-06-01T00:00:00Z' }, now }),
    ).toBeNull();
  });

  it('should return null when there is no last-commit date', () => {
    expect(commitAgeCheck({ data: { ...base, lastCommit: null }, now })).toBeNull();
  });

  it('should respect an explicit commitAgeYears override', () => {
    const reason = commitAgeCheck({
      data: { ...base, lastCommit: '2025-01-01T00:00:00Z' },
      now,
      thresholds: { ...DEFAULT_THRESHOLDS, commitAgeYears: 1 },
    });
    expect(reason).toMatchObject({ check: 'commit-age', confidence: 'soft' });
  });
});

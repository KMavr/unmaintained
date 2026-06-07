import { describe, expect, it } from 'vitest';
import { staleIssuesCheck } from '../../src/checks/soft/staleIssues.js';
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
  openIssues: 19,
  closedIssues: 1,
  repoCreatedAt: '2020-01-01T00:00:00Z',
};

const now = new Date('2026-06-05T00:00:00Z');

describe('staleIssuesCheck', () => {
  it('should flag an old repo with a high open-issue ratio above the floor', () => {
    const reason = staleIssuesCheck({ data: base, now });
    expect(reason).toMatchObject({ check: 'stale-issues', confidence: 'soft' });
    expect(reason?.detail).toContain('19 of 20');
  });

  it('should return null when issue counts are unknown (no token)', () => {
    expect(staleIssuesCheck({ data: { ...base, openIssues: null }, now })).toBeNull();
    expect(staleIssuesCheck({ data: { ...base, closedIssues: null }, now })).toBeNull();
    expect(staleIssuesCheck({ data: { ...base, repoCreatedAt: null }, now })).toBeNull();
  });

  it('should return null for a repo younger than the age guard', () => {
    expect(
      staleIssuesCheck({ data: { ...base, repoCreatedAt: '2026-03-01T00:00:00Z' }, now }),
    ).toBeNull();
  });

  it('should return null when total issues are below the floor', () => {
    expect(staleIssuesCheck({ data: { ...base, openIssues: 9, closedIssues: 1 }, now })).toBeNull();
  });

  it('should return null when the open ratio is below the threshold', () => {
    expect(
      staleIssuesCheck({ data: { ...base, openIssues: 10, closedIssues: 10 }, now }),
    ).toBeNull();
  });
});

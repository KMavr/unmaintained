import { describe, expect, it } from 'vitest';
import { releaseCadenceCheck } from '../../src/checks/soft/releaseCadence.js';
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
};

const now = new Date('2026-06-05T00:00:00Z');

describe('releaseCadenceCheck', () => {
  it('should flag a package whose last release is older than the cadence threshold', () => {
    const reason = releaseCadenceCheck({ data: { ...base, lastPublish: '2022-01-01' }, now });
    expect(reason).toMatchObject({ check: 'cadence', confidence: 'soft' });
    expect(reason?.detail).toContain('2022-01-01');
  });

  it('should return null for a package released within the threshold', () => {
    expect(releaseCadenceCheck({ data: { ...base, lastPublish: '2025-06-01' }, now })).toBeNull();
  });

  it('should return null when there is no publish date', () => {
    expect(releaseCadenceCheck({ data: { ...base, lastPublish: null }, now })).toBeNull();
  });

  it('should respect an explicit cadenceYears override', () => {
    const reason = releaseCadenceCheck({
      data: { ...base, lastPublish: '2025-01-01' },
      now,
      thresholds: { ...DEFAULT_THRESHOLDS, cadenceYears: 1 },
    });
    expect(reason).toMatchObject({ check: 'cadence', confidence: 'soft' });
  });
});

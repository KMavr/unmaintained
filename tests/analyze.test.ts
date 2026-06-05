import { describe, expect, it } from 'vitest';
import { analyze } from '../src/analyze.js';
import type { DirectDependency } from '../src/lib/directDependencies.js';
import type { PackageData, Sources } from '../src/types.js';

const packageData = (overrides: Partial<PackageData> = {}): PackageData => ({
  name: 'left-pad',
  latestVersion: '1.3.0',
  deprecated: null,
  repositoryUrl: null,
  archived: false,
  topics: [],
  lastPublish: '2024-01-01',
  ...overrides,
});

const fakeSources = (data: PackageData): Sources => ({
  fetchPackage: async () => data,
});

const dep: DirectDependency = { name: 'left-pad', range: '^1.3.0', dev: false };

describe('analyze', () => {
  it('should flag a deprecated package as unmaintained with a hard reason', async () => {
    const finding = await analyze(
      dep,
      fakeSources(packageData({ deprecated: 'use String.prototype.padStart' })),
    );
    expect(finding.tier).toBe('unmaintained');
    expect(finding.version).toBe('1.3.0');
    expect(finding.reasons).toHaveLength(1);
    expect(finding.reasons[0]).toMatchObject({ check: 'deprecated', confidence: 'hard' });
  });

  it('should mark a healthy package as maintained with no reasons', async () => {
    const finding = await analyze(dep, fakeSources(packageData()));
    expect(finding.tier).toBe('maintained');
    expect(finding.reasons).toEqual([]);
  });

  it('should fall back to the declared range when latestVersion is unknown', async () => {
    const finding = await analyze(dep, fakeSources(packageData({ latestVersion: null })));
    expect(finding.version).toBe('^1.3.0');
  });

  it('should flag an archived (non-deprecated) package as unmaintained', async () => {
    const finding = await analyze(dep, fakeSources(packageData({ archived: true })));
    expect(finding.tier).toBe('unmaintained');
    expect(finding.reasons).toHaveLength(1);
    expect(finding.reasons[0]).toMatchObject({ check: 'archived', confidence: 'hard' });
  });

  it('should flag a repository with an unmaintained topic', async () => {
    const finding = await analyze(dep, fakeSources(packageData({ topics: ['abandoned'] })));
    expect(finding.tier).toBe('unmaintained');
    expect(finding.reasons[0]).toMatchObject({ check: 'topic', confidence: 'hard' });
  });

  const now = new Date('2026-06-05T00:00:00Z');

  it('should report a stale release as probably unmaintained when soft checks are enabled', async () => {
    const finding = await analyze(
      dep,
      fakeSources(packageData({ lastPublish: '2020-01-01' })),
      true,
      now,
    );
    expect(finding.tier).toBe('probably');
    expect(finding.reasons[0]).toMatchObject({ check: 'cadence', confidence: 'soft' });
  });

  it('should ignore soft signals unless --soft is enabled', async () => {
    const finding = await analyze(
      dep,
      fakeSources(packageData({ lastPublish: '2020-01-01' })),
      false,
      now,
    );
    expect(finding.tier).toBe('maintained');
    expect(finding.reasons).toEqual([]);
  });

  it('should let a hard signal win over a co-occurring soft signal', async () => {
    const finding = await analyze(
      dep,
      fakeSources(packageData({ deprecated: 'use padStart', lastPublish: '2020-01-01' })),
      true,
      now,
    );
    expect(finding.tier).toBe('unmaintained');
    expect(finding.reasons.map((reason) => reason.check)).toEqual(['deprecated', 'cadence']);
  });
});

import { describe, expect, it } from 'vitest';
import { analyze } from '../src/analyze.js';
import type { DirectDependency } from '../src/lib/directDependencies.js';
import type { PackageData } from '../src/types.js';

const packageData = (overrides: Partial<PackageData> = {}): PackageData => ({
  name: 'left-pad',
  latestVersion: '1.3.0',
  deprecated: null,
  repositoryUrl: null,
  archived: false,
  topics: [],
  lastPublish: '2024-01-01',
  maintainerCount: 2,
  ...overrides,
});

const dep: DirectDependency = { name: 'left-pad', range: '^1.3.0', dev: false };
const now = new Date('2026-06-05T00:00:00Z');

describe('analyze', () => {
  it('should flag a deprecated package as unmaintained with a hard reason', () => {
    const finding = analyze(dep, packageData({ deprecated: 'use String.prototype.padStart' }));
    expect(finding.tier).toBe('unmaintained');
    expect(finding.version).toBe('1.3.0');
    expect(finding.reasons).toHaveLength(1);
    expect(finding.reasons[0]).toMatchObject({ check: 'deprecated', confidence: 'hard' });
  });

  it('should mark a healthy package as maintained with no reasons', () => {
    const finding = analyze(dep, packageData());
    expect(finding.tier).toBe('maintained');
    expect(finding.reasons).toEqual([]);
  });

  it('should fall back to the declared range when latestVersion is unknown', () => {
    const finding = analyze(dep, packageData({ latestVersion: null }));
    expect(finding.version).toBe('^1.3.0');
  });

  it('should flag an archived (non-deprecated) package as unmaintained', () => {
    const finding = analyze(dep, packageData({ archived: true }));
    expect(finding.tier).toBe('unmaintained');
    expect(finding.reasons).toHaveLength(1);
    expect(finding.reasons[0]).toMatchObject({ check: 'archived', confidence: 'hard' });
  });

  it('should flag a repository with an unmaintained topic', () => {
    const finding = analyze(dep, packageData({ topics: ['abandoned'] }));
    expect(finding.tier).toBe('unmaintained');
    expect(finding.reasons[0]).toMatchObject({ check: 'topic', confidence: 'hard' });
  });

  it('should report a stale release as probably unmaintained when soft checks are enabled', () => {
    const finding = analyze(dep, packageData({ lastPublish: '2020-01-01' }), true, now);
    expect(finding.tier).toBe('probably');
    expect(finding.reasons[0]).toMatchObject({ check: 'cadence', confidence: 'soft' });
  });

  it('should ignore soft signals unless --soft is enabled', () => {
    const finding = analyze(dep, packageData({ lastPublish: '2020-01-01' }), false, now);
    expect(finding.tier).toBe('maintained');
    expect(finding.reasons).toEqual([]);
  });

  it('should let a hard signal win over a co-occurring soft signal', () => {
    const finding = analyze(
      dep,
      packageData({ deprecated: 'use padStart', lastPublish: '2020-01-01' }),
      true,
      now,
    );
    expect(finding.tier).toBe('unmaintained');
    expect(finding.reasons.map((reason) => reason.check)).toEqual(['deprecated', 'cadence']);
  });
});

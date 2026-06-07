import { describe, expect, it } from 'vitest';
import { soloMaintainerCheck } from '../../src/checks/soft/soloMaintainer.js';
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
};

describe('soloMaintainerCheck', () => {
  it('should flag a package with exactly one maintainer', () => {
    const reason = soloMaintainerCheck({ data: { ...base, maintainerCount: 1 } });
    expect(reason).toMatchObject({ check: 'solo-maintainer', confidence: 'soft' });
    expect(reason?.detail).toContain('left-pad');
  });

  it('should return null when there are multiple maintainers', () => {
    expect(soloMaintainerCheck({ data: { ...base, maintainerCount: 3 } })).toBeNull();
  });

  it('should return null when the maintainer count is unknown', () => {
    expect(soloMaintainerCheck({ data: { ...base, maintainerCount: null } })).toBeNull();
  });

  it('should return null when there are no maintainers listed', () => {
    expect(soloMaintainerCheck({ data: { ...base, maintainerCount: 0 } })).toBeNull();
  });
});

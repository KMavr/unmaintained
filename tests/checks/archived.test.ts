import { describe, expect, it } from 'vitest';
import { archivedCheck } from '../../src/checks/hard/archived.js';
import type { PackageData } from '../../src/types.js';

const base: PackageData = {
  name: 'request',
  latestVersion: '2.88.2',
  deprecated: null,
  repositoryUrl: 'https://github.com/request/request',
  archived: null,
};

describe('archivedCheck', () => {
  it('should flag an archived repository as a hard reason', () => {
    expect(archivedCheck({ ...base, archived: true })).toMatchObject({
      check: 'archived',
      confidence: 'hard',
    });
  });

  it('should return null when the repository is not archived or unknown', () => {
    expect(archivedCheck({ ...base, archived: false })).toBeNull();
    expect(archivedCheck({ ...base, archived: null })).toBeNull();
  });
});

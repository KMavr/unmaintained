import { describe, expect, it } from 'vitest';
import { unmaintainedTopicCheck } from '../../src/checks/hard/unmaintainedTopic.js';
import type { PackageData } from '../../src/types.js';

const base: PackageData = {
  name: 'foo',
  latestVersion: '1.0.0',
  deprecated: null,
  repositoryUrl: 'https://github.com/foo/bar',
  archived: false,
  topics: [],
};

describe('unmaintainedTopicCheck', () => {
  it('should flag a repository tagged with an unmaintained topic', () => {
    const reason = unmaintainedTopicCheck({ ...base, topics: ['nodejs', 'abandoned'] });
    expect(reason).toMatchObject({ check: 'topic', confidence: 'hard' });
    expect(reason?.detail).toContain('abandoned');
  });

  it('should return null when no unmaintained topic is present', () => {
    expect(unmaintainedTopicCheck({ ...base, topics: ['nodejs', 'cli'] })).toBeNull();
    expect(unmaintainedTopicCheck({ ...base, topics: [] })).toBeNull();
  });
});

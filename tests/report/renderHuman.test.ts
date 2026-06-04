import { describe, expect, it } from 'vitest';
import { renderHuman } from '../../src/report/renderHuman.js';
import type { Finding } from '../../src/types.js';

const unmaintained: Finding = {
  name: 'request',
  version: '2.88.2',
  tier: 'unmaintained',
  reasons: [{ check: 'deprecated', detail: 'request is flagged deprecated.', confidence: 'hard' }],
};

const maintained: Finding = {
  name: 'commander',
  version: '15.0.0',
  tier: 'maintained',
  reasons: [],
};

describe('renderHuman', () => {
  it('should report no unmaintained dependencies for an empty list', () => {
    expect(renderHuman([])).toContain('No unmaintained dependencies found.');
  });

  it('should report none when every dependency is maintained', () => {
    const output = renderHuman([maintained]);
    expect(output).toContain('No unmaintained dependencies found.');
    expect(output).not.toContain('commander');
  });

  it('should list an unmaintained dependency with its reasons', () => {
    const output = renderHuman([unmaintained]);
    expect(output).toContain('request@2.88.2 is unmaintained');
    expect(output).toContain('deprecated: request is flagged deprecated. - Confidence: hard');
  });

  it('should show only unmaintained dependencies in a mixed list', () => {
    const output = renderHuman([maintained, unmaintained]);
    expect(output).toContain('request@2.88.2 is unmaintained');
    expect(output).not.toContain('commander');
  });
});

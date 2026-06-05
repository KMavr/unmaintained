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

const probably: Finding = {
  name: 'left-pad',
  version: '1.3.0',
  tier: 'probably',
  reasons: [
    {
      check: 'cadence',
      detail: "left-pad's last release was 4.0 years ago (2022-01-01).",
      confidence: 'soft',
    },
  ],
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
    expect(output).toContain('request is flagged deprecated.');
  });

  it('should show only unmaintained dependencies in a mixed list', () => {
    const output = renderHuman([maintained, unmaintained]);
    expect(output).toContain('request@2.88.2 is unmaintained');
    expect(output).not.toContain('commander');
  });

  it('should render the probably tier in its own section', () => {
    const output = renderHuman([unmaintained, probably]);
    expect(output).toContain('request@2.88.2 is unmaintained');
    expect(output).toContain('left-pad@1.3.0 is probably unmaintained');
    expect(output).toContain('4.0 years ago');
  });

  it('should render a probably-only list without the all-clear message', () => {
    const output = renderHuman([probably]);
    expect(output).not.toContain('No unmaintained dependencies found.');
    expect(output).toContain('left-pad@1.3.0 is probably unmaintained');
  });
});

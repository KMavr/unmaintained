import { describe, expect, it } from 'vitest';
import { renderJson } from '../../src/report/renderJson.js';
import type { Finding } from '../../src/types.js';

const findings: Finding[] = [
  {
    name: 'request',
    version: '2.88.2',
    tier: 'unmaintained',
    reasons: [{ check: 'deprecated', detail: 'request has been deprecated', confidence: 'hard' }],
  },
  {
    name: 'left-pad',
    version: '1.3.0',
    tier: 'probably',
    reasons: [{ check: 'cadence', detail: 'no release in 3 years', confidence: 'soft' }],
  },
  { name: 'chalk', version: '5.3.0', tier: 'maintained', reasons: [] },
];

describe('renderJson', () => {
  it('should emit valid JSON', () => {
    expect(() => JSON.parse(renderJson(findings))).not.toThrow();
  });

  it('should summarise the count of each tier', () => {
    const { summary } = JSON.parse(renderJson(findings));
    expect(summary).toEqual({ total: 3, unmaintained: 1, probably: 1, maintained: 1 });
  });

  it('should preserve every finding with its reasons', () => {
    const parsed = JSON.parse(renderJson(findings));
    expect(parsed.findings).toEqual(findings);
    expect(parsed.findings[0].reasons[0]).toMatchObject({
      check: 'deprecated',
      confidence: 'hard',
    });
  });

  it('should report zero counts for an empty finding set', () => {
    const { summary, findings: out } = JSON.parse(renderJson([]));
    expect(summary).toEqual({ total: 0, unmaintained: 0, probably: 0, maintained: 0 });
    expect(out).toEqual([]);
  });
});

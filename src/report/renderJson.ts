import { Finding } from '../types.js';

export const renderJson = (findings: Finding[]) => {
  const counts = findings.reduce(
    (acc, { tier }) => {
      acc[tier] += 1;
      return acc;
    },
    { unmaintained: 0, probably: 0, maintained: 0 },
  );

  return JSON.stringify(
    {
      summary: {
        total: findings.length,
        unmaintained: counts.unmaintained,
        probably: counts.probably,
        maintained: counts.maintained,
      },
      findings,
    },
    null,
    2,
  );
};

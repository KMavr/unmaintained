import chalk from 'chalk';
import { Finding } from '../types.js';

export const renderHuman = (findings: Finding[]): string => {
  const unmaintained = findings.filter((finding) => finding.tier === 'unmaintained');

  if (unmaintained.length === 0) {
    return chalk.green('No unmaintained dependencies found.');
  }

  return unmaintained
    .map(({ name, version, reasons }) => {
      const reasonsList = reasons
        .map((reason) => `${reason.check}: ${reason.detail} - Confidence: ${reason.confidence}`)
        .join('\n');
      return chalk.red(`${name}@${version} is unmaintained\n${reasonsList}`);
    })
    .join('\n\n');
};

import chalk, { type ChalkInstance } from 'chalk';
import { Finding } from '../types.js';

const renderGroup = (
  findings: Finding[],
  marker: string,
  label: string,
  color: ChalkInstance,
): string =>
  findings
    .map(({ name, version, reasons, path }) => {
      const head = color(`${marker} ${name}@${version} ${label}`);
      const via =
        path && path.length > 1 ? `\n    ${chalk.dim(`via ${path.slice(0, -1).join(' › ')}`)}` : '';
      const bullets = reasons.map((reason) => `    • ${reason.detail}`).join('\n');
      return `${head}${via}\n${bullets}`;
    })
    .join('\n\n');

export const renderHuman = (findings: Finding[]): string => {
  const unmaintained = findings.filter((finding) => finding.tier === 'unmaintained');
  const probably = findings.filter((finding) => finding.tier === 'probably');

  if (unmaintained.length === 0 && probably.length === 0) {
    return chalk.green('No unmaintained dependencies found.');
  }

  return [
    renderGroup(unmaintained, '✗', 'is unmaintained', chalk.red),
    renderGroup(probably, '?', 'is probably unmaintained', chalk.yellow),
  ]
    .filter((section) => section.length > 0)
    .join('\n\n');
};

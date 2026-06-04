import { describe, expect, it } from 'vitest';
import { directDependencies } from '../../src/lib/directDependencies.js';

describe('directDependencies', () => {
  it('should return dependencies and devDependencies with a dev flag when includeDev is true', () => {
    const pkg = {
      dependencies: { commander: '^15.0.0' },
      devDependencies: { vitest: '^4.1.7' },
    };
    expect(directDependencies(pkg, true)).toEqual([
      { name: 'commander', range: '^15.0.0', dev: false },
      { name: 'vitest', range: '^4.1.7', dev: true },
    ]);
  });

  it('should skip devDependencies when includeDev is false', () => {
    const pkg = {
      dependencies: { commander: '^15.0.0' },
      devDependencies: { vitest: '^4.1.7' },
    };
    expect(directDependencies(pkg, false)).toEqual([
      { name: 'commander', range: '^15.0.0', dev: false },
    ]);
  });

  it('should return an empty array when there are no dependencies', () => {
    expect(directDependencies({ name: 'empty' }, true)).toEqual([]);
  });

  it('should handle missing dependencies and devDependencies keys', () => {
    expect(directDependencies({ devDependencies: { vitest: '^4.1.7' } }, false)).toEqual([]);
    expect(directDependencies({ dependencies: { chalk: '^5.6.2' } }, true)).toEqual([
      { name: 'chalk', range: '^5.6.2', dev: false },
    ]);
  });
});

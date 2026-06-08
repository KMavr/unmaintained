import { describe, expect, it } from 'vitest';
import { transitiveDependencies } from '../../src/lib/transitiveDependencies.js';

// Shape of `npm ls --json --all`: a root node whose `dependencies` map nests
// the installed tree. `shared-util` is reached via both `commander` and the
// dev-only `vitest`, so it exercises de-duplication across paths.
const tree = {
  name: 'unmaintained',
  version: '0.2.0',
  dependencies: {
    commander: {
      version: '13.0.0',
      dependencies: {
        'shared-util': { version: '1.0.0' },
      },
    },
    chalk: {
      version: '5.3.0',
    },
    vitest: {
      version: '4.1.7',
      dev: true,
      dependencies: {
        'shared-util': { version: '1.0.0' },
      },
    },
  },
};

describe('transitiveDependencies', () => {
  it('should flatten the nested tree into one entry per unique package', () => {
    expect(
      transitiveDependencies(tree)
        .map((dep) => dep.name)
        .sort(),
    ).toEqual(['chalk', 'commander', 'shared-util', 'vitest']);
  });

  it('should record the path from a direct dependency down to a transitive one', () => {
    const shared = transitiveDependencies(tree).find((dep) => dep.name === 'shared-util');
    expect(shared).toMatchObject({
      name: 'shared-util',
      version: '1.0.0',
      path: ['commander', 'shared-util'],
    });
  });

  it('should de-duplicate a package reached through multiple paths', () => {
    const shared = transitiveDependencies(tree).filter((dep) => dep.name === 'shared-util');
    expect(shared).toHaveLength(1);
  });

  it('should carry the dev flag from the installed node', () => {
    const dev = transitiveDependencies(tree).find((dep) => dep.name === 'vitest');
    expect(dev?.dev).toBe(true);
  });

  it('should stop at the given depth', () => {
    const direct = transitiveDependencies(tree, 1);
    expect(direct.map((dep) => dep.name).sort()).toEqual(['chalk', 'commander', 'vitest']);
  });
});

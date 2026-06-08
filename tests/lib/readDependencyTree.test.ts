import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DependencyTreeError, readDependencyTree } from '../../src/lib/readDependencyTree.js';
// `readDependencyTree` does `const run = promisify(execFile)` at module scope.
// Mocking `promisify` to return our own mock makes `run` directly controllable,
// so each test resolves/rejects the npm-ls call without touching a real shell.
const { execFileMock } = vi.hoisted(() => ({ execFileMock: vi.fn() }));
vi.mock('node:child_process', () => ({ execFile: execFileMock }));
vi.mock('node:util', () => ({ promisify: () => execFileMock }));

const tree = {
  name: 'root',
  version: '1.0.0',
  dependencies: { chalk: { version: '5.3.0' } },
};

beforeEach(() => {
  execFileMock.mockReset();
});

describe('readDependencyTree', () => {
  it('should parse and return the tree on a clean exit', async () => {
    execFileMock.mockResolvedValue({ stdout: JSON.stringify(tree) });
    expect(await readDependencyTree('/project', false)).toEqual(tree);
  });

  it('should still parse stdout when npm ls exits non-zero', async () => {
    // npm ls rejects on peer/extraneous warnings but the JSON is on error.stdout.
    execFileMock.mockRejectedValue({ stdout: JSON.stringify(tree) });
    expect(await readDependencyTree('/project', false)).toEqual(tree);
  });

  it('should run npm ls with the project cwd and a large maxBuffer', async () => {
    execFileMock.mockResolvedValue({ stdout: JSON.stringify(tree) });
    await readDependencyTree('/project', false);
    expect(execFileMock).toHaveBeenCalledWith(
      'npm',
      ['ls', '--json', '--all'],
      expect.objectContaining({ cwd: '/project', maxBuffer: expect.any(Number) }),
    );
  });

  it('should add --omit=dev when production is true', async () => {
    execFileMock.mockResolvedValue({ stdout: JSON.stringify(tree) });
    await readDependencyTree('/project', true);
    expect(execFileMock).toHaveBeenCalledWith(
      'npm',
      ['ls', '--json', '--all', '--omit=dev'],
      expect.anything(),
    );
  });

  it('should throw DependencyTreeError when there is no stdout at all', async () => {
    execFileMock.mockRejectedValue({ message: 'npm not found' });
    await expect(readDependencyTree('/project', false)).rejects.toThrow(DependencyTreeError);
  });

  it('should throw DependencyTreeError when stdout is not valid JSON', async () => {
    execFileMock.mockResolvedValue({ stdout: 'not json' });
    await expect(readDependencyTree('/project', false)).rejects.toThrow(DependencyTreeError);
  });
});

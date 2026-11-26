import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import run from '../src/run.js';
import { DependencyTreeError, readDependencyTree } from '../src/lib/readDependencyTree.js';
import { PackageJsonError, readPackageJson } from '../src/lib/readPackageJson.js';
import { createDefaultSources } from '../src/sources/index.js';
import type { PackageData, RunOptions } from '../src/types.js';

vi.mock('../src/lib/readPackageJson.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/readPackageJson.js')>()),
  readPackageJson: vi.fn(),
}));
vi.mock('../src/lib/readDependencyTree.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/readDependencyTree.js')>()),
  readDependencyTree: vi.fn(),
}));
vi.mock('../src/sources/index.js', () => ({ createDefaultSources: vi.fn() }));

const packageData = (name: string, overrides: Partial<PackageData> = {}): PackageData => ({
  name,
  latestVersion: '1.0.0',
  deprecated: null,
  repositoryUrl: null,
  archived: false,
  topics: [],
  lastPublish: new Date().toISOString(),
  maintainerCount: 2,
  lastCommit: null,
  openIssues: null,
  closedIssues: null,
  repoCreatedAt: null,
  scorecardMaintained: null,
  ...overrides,
});

const options = (overrides: Partial<RunOptions> = {}): RunOptions => ({
  cwd: '/project',
  strict: false,
  soft: false,
  transitive: false,
  production: false,
  json: false,
  ...overrides,
});

const fetchPackages = vi.fn();
const setup = (data: PackageData[], gitHubRateLimited = 0) => {
  fetchPackages.mockResolvedValue(data);
  vi.mocked(createDefaultSources).mockReturnValue({
    sources: { fetchPackages },
    diagnostics: { gitHubRateLimited },
  });
};

describe('run', () => {
  let log: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(readPackageJson).mockResolvedValue({
      dependencies: { good: '^1.0.0' },
      devDependencies: { bad: '^1.0.0' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should return 0 and print a human report for direct dependencies', async () => {
    setup([packageData('good'), packageData('bad')]);
    expect(await run(options())).toBe(0);
    expect(fetchPackages).toHaveBeenCalledWith(['good', 'bad']);
    expect(log).toHaveBeenCalledOnce();
    expect(readDependencyTree).not.toHaveBeenCalled();
  });

  it('should exclude dev dependencies when production is set', async () => {
    setup([packageData('good')]);
    await run(options({ production: true }));
    expect(fetchPackages).toHaveBeenCalledWith(['good']);
  });

  it('should print JSON when json is set', async () => {
    setup([packageData('good'), packageData('bad')]);
    await run(options({ json: true }));
    expect(() => JSON.parse(log.mock.calls[0][0] as string)).not.toThrow();
  });

  it('should return 1 in strict mode when a package is unmaintained', async () => {
    setup([packageData('good'), packageData('bad', { deprecated: 'use something else' })]);
    expect(await run(options({ strict: true }))).toBe(1);
  });

  it('should return 0 in strict mode when nothing is unmaintained', async () => {
    setup([packageData('good'), packageData('bad')]);
    expect(await run(options({ strict: true }))).toBe(0);
  });

  it('should return 0 for an unmaintained package without strict', async () => {
    setup([packageData('good'), packageData('bad', { deprecated: 'x' })]);
    expect(await run(options())).toBe(0);
  });

  it('should read the dependency tree when transitive is set', async () => {
    vi.mocked(readDependencyTree).mockResolvedValue({
      dependencies: { a: { version: '1.0.0', dependencies: { b: { version: '2.0.0' } } } },
    });
    setup([packageData('a'), packageData('b')]);
    await run(options({ transitive: true, production: true }));
    expect(readDependencyTree).toHaveBeenCalledWith('/project', true);
    expect(fetchPackages).toHaveBeenCalledWith(['a', 'b']);
  });

  it('should warn on stderr when GitHub was rate limited', async () => {
    setup([packageData('good'), packageData('bad')], 3);
    await run(options());
    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0][0]).toContain('3 package(s)');
  });

  it('should not warn when GitHub was not rate limited', async () => {
    setup([packageData('good'), packageData('bad')]);
    await run(options());
    expect(error).not.toHaveBeenCalled();
  });

  it('should return 2 and print the message on PackageJsonError', async () => {
    vi.mocked(readPackageJson).mockRejectedValue(new PackageJsonError('no package.json'));
    expect(await run(options())).toBe(2);
    expect(error).toHaveBeenCalledWith('no package.json');
  });

  it('should return 2 and print the message on DependencyTreeError', async () => {
    vi.mocked(readDependencyTree).mockRejectedValue(new DependencyTreeError('npm ls failed'));
    expect(await run(options({ transitive: true }))).toBe(2);
    expect(error).toHaveBeenCalledWith('npm ls failed');
  });

  it('should rethrow unexpected errors', async () => {
    vi.mocked(readPackageJson).mockRejectedValue(new Error('boom'));
    await expect(run(options())).rejects.toThrow('boom');
  });
});

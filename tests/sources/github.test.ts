import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchGitHubRepo,
  fetchGitHubReposGraphQL,
  GitHubRateLimitError,
} from '../../src/sources/github.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchGitHubRepo', () => {
  it('should return null without fetching when there is no repository url', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchGitHubRepo(null)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return null without fetching for a non-GitHub repository url', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchGitHubRepo('https://gitlab.com/foo/bar')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return the archived flag and topics from the GitHub response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ archived: true, topics: ['unmaintained'] }),
      }),
    );
    expect(await fetchGitHubRepo('git+https://github.com/request/request.git')).toEqual({
      archived: true,
      topics: ['unmaintained'],
      lastCommit: null,
    });
  });

  it('should default archived to false and topics to empty when the fields are absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    expect(await fetchGitHubRepo('https://github.com/foo/bar')).toEqual({
      archived: false,
      topics: [],
      lastCommit: null,
    });
  });

  it('should return null when the GitHub request fails for a non-rate-limit reason', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, headers: new Headers() }),
    );
    expect(await fetchGitHubRepo('https://github.com/foo/bar')).toBeNull();
  });

  it('should return null for a 403 that is not a rate limit (e.g. private repo)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ 'x-ratelimit-remaining': '57' }),
      }),
    );
    expect(await fetchGitHubRepo('https://github.com/foo/bar')).toBeNull();
  });

  it('should throw GitHubRateLimitError on a 403 with no remaining quota', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ 'x-ratelimit-remaining': '0' }),
      }),
    );
    await expect(fetchGitHubRepo('https://github.com/foo/bar')).rejects.toBeInstanceOf(
      GitHubRateLimitError,
    );
  });

  it('should throw GitHubRateLimitError on a 429 with no remaining quota', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'x-ratelimit-remaining': '0' }),
      }),
    );
    await expect(fetchGitHubRepo('https://github.com/foo/bar')).rejects.toBeInstanceOf(
      GitHubRateLimitError,
    );
  });
});

const graphQlNode = (archived: boolean, topics: string[], pushedAt: string | null = null) => ({
  isArchived: archived,
  pushedAt,
  repositoryTopics: { nodes: topics.map((name) => ({ topic: { name } })) },
});

describe('fetchGitHubReposGraphQL', () => {
  it('should return null for every entry without fetching when no url resolves', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchGitHubReposGraphQL([null, 'https://gitlab.com/foo/bar'], 'tok')).toEqual([
      null,
      null,
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should map each repository to its archived flag and topics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            r0: graphQlNode(true, ['unmaintained'], '2021-01-01T00:00:00Z'),
            r1: graphQlNode(false, ['cli']),
          },
        }),
      }),
    );
    expect(
      await fetchGitHubReposGraphQL(
        ['https://github.com/a/b', 'git+https://github.com/c/d.git'],
        'tok',
      ),
    ).toEqual([
      { archived: true, topics: ['unmaintained'], lastCommit: '2021-01-01T00:00:00Z' },
      { archived: false, topics: ['cli'], lastCommit: null },
    ]);
  });

  it('should keep results aligned to the input when some urls are absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { r0: graphQlNode(true, []), r2: graphQlNode(false, []) } }),
      }),
    );
    expect(
      await fetchGitHubReposGraphQL(
        ['https://github.com/a/b', null, 'https://github.com/c/d'],
        'tok',
      ),
    ).toEqual([
      { archived: true, topics: [], lastCommit: null },
      null,
      { archived: false, topics: [], lastCommit: null },
    ]);
  });

  it('should yield null for a repository the query could not resolve', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { r0: graphQlNode(true, []), r1: null } }),
      }),
    );
    expect(
      await fetchGitHubReposGraphQL(['https://github.com/a/b', 'https://github.com/c/d'], 'tok'),
    ).toEqual([{ archived: true, topics: [], lastCommit: null }, null]);
  });

  it('should throw GitHubRateLimitError on a 403 with no remaining quota', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ 'x-ratelimit-remaining': '0' }),
      }),
    );
    await expect(fetchGitHubReposGraphQL(['https://github.com/a/b'], 'tok')).rejects.toBeInstanceOf(
      GitHubRateLimitError,
    );
  });

  it('should throw GitHubRateLimitError on a 200 response carrying a RATE_LIMITED error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: null, errors: [{ type: 'RATE_LIMITED' }] }),
      }),
    );
    await expect(fetchGitHubReposGraphQL(['https://github.com/a/b'], 'tok')).rejects.toBeInstanceOf(
      GitHubRateLimitError,
    );
  });
});

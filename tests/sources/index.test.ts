import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSources } from '../../src/sources/index.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const npmResponse = {
  ok: true,
  json: async () => ({
    'dist-tags': { latest: '1.0.0' },
    repository: 'https://github.com/foo/bar',
  }),
};

describe('createDefaultSources', () => {
  it('should degrade to unknown archived status and count the rate limit when GitHub is throttled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('api.github.com')
          ? { ok: false, status: 403, headers: new Headers({ 'x-ratelimit-remaining': '0' }) }
          : npmResponse,
      ),
    );

    const { sources, diagnostics } = createDefaultSources();
    const [data] = await sources.fetchPackages(['foo']);

    expect(data.archived).toBeNull();
    expect(data.topics).toEqual([]);
    expect(diagnostics.gitHubRateLimited).toBe(1);
  });

  it('should degrade to null without crashing when a GitHub request throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('api.github.com')) {
          throw new Error('socket hang up');
        }
        return npmResponse;
      }),
    );

    const { sources, diagnostics } = createDefaultSources();
    const [data] = await sources.fetchPackages(['foo']);

    // A thrown request is not a rate-limit, so it degrades silently (no count).
    expect(data.archived).toBeNull();
    expect(diagnostics.gitHubRateLimited).toBe(0);
  });

  it('should degrade to empty data when the npm request throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNRESET');
      }),
    );

    const { sources } = createDefaultSources();
    const [data] = await sources.fetchPackages(['foo']);

    expect(data).toMatchObject({ name: 'foo', latestVersion: null, repositoryUrl: null });
  });

  it('should not count anything when GitHub responds normally', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('api.github.com')
          ? { ok: true, json: async () => ({ archived: true, topics: ['unmaintained'] }) }
          : npmResponse,
      ),
    );

    const { sources, diagnostics } = createDefaultSources();
    const [data] = await sources.fetchPackages(['foo']);

    expect(data.archived).toBe(true);
    expect(data.topics).toEqual(['unmaintained']);
    expect(diagnostics.gitHubRateLimited).toBe(0);
  });

  it('should merge the OpenSSF Maintained score from deps.dev', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('api.deps.dev')) {
          return {
            ok: true,
            json: async () => ({ scorecard: { checks: [{ name: 'Maintained', score: 1 }] } }),
          };
        }
        if (url.includes('api.github.com')) {
          return { ok: true, json: async () => ({ archived: false, topics: [] }) };
        }
        return npmResponse;
      }),
    );

    const { sources } = createDefaultSources();
    const [data] = await sources.fetchPackages(['foo']);

    expect(data.scorecardMaintained).toBe(1);
  });

  it('should batch through the GraphQL endpoint and merge results when a token is provided', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('api.github.com/graphql')
        ? {
            ok: true,
            json: async () => ({
              data: {
                r0: {
                  isArchived: true,
                  pushedAt: null,
                  createdAt: null,
                  openIssues: { totalCount: 0 },
                  closedIssues: { totalCount: 0 },
                  repositoryTopics: { nodes: [{ topic: { name: 'unmaintained' } }] },
                },
              },
            }),
          }
        : npmResponse,
    );
    vi.stubGlobal('fetch', fetchMock);

    const { sources, diagnostics } = createDefaultSources('tok');
    const [data] = await sources.fetchPackages(['foo']);

    expect(data.archived).toBe(true);
    expect(data.topics).toEqual(['unmaintained']);
    expect(diagnostics.gitHubRateLimited).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith('https://api.github.com/graphql', expect.anything());
  });

  it('should count every batched package when the GraphQL call is rate-limited', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('api.github.com/graphql')
          ? { ok: false, status: 403, headers: new Headers({ 'x-ratelimit-remaining': '0' }) }
          : npmResponse,
      ),
    );

    const { sources, diagnostics } = createDefaultSources('tok');
    const results = await sources.fetchPackages(['foo', 'bar']);

    expect(results.every((data) => data.archived === null)).toBe(true);
    expect(diagnostics.gitHubRateLimited).toBe(2);
  });
});

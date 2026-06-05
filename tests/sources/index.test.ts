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
    const data = await sources.fetchPackage('foo');

    expect(data.archived).toBeNull();
    expect(data.topics).toEqual([]);
    expect(diagnostics.gitHubRateLimited).toBe(1);
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
    const data = await sources.fetchPackage('foo');

    expect(data.archived).toBe(true);
    expect(data.topics).toEqual(['unmaintained']);
    expect(diagnostics.gitHubRateLimited).toBe(0);
  });
});

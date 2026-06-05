import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGitHubRepo, GitHubRateLimitError } from '../../src/sources/github.js';

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
    });
  });

  it('should default archived to false and topics to empty when the fields are absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    expect(await fetchGitHubRepo('https://github.com/foo/bar')).toEqual({
      archived: false,
      topics: [],
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

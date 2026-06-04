import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchArchived } from '../../src/sources/github.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchArchived', () => {
  it('should return null without fetching when there is no repository url', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchArchived(null)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return null without fetching for a non-GitHub repository url', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchArchived('https://gitlab.com/foo/bar')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return true when GitHub reports the repository archived', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ archived: true }) }),
    );
    expect(await fetchArchived('git+https://github.com/request/request.git')).toBe(true);
  });

  it('should return null when the GitHub request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchArchived('https://github.com/foo/bar')).toBeNull();
  });
});

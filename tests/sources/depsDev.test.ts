import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchDepsDevScores } from '../../src/sources/depsDev.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const scorecardResponse = (maintainedScore: number) => ({
  ok: true,
  json: async () => ({
    scorecard: {
      checks: [
        { name: 'Code-Review', score: 7 },
        { name: 'Maintained', score: maintainedScore },
      ],
    },
  }),
});

describe('fetchDepsDevScores', () => {
  it('should return null for every entry without fetching when no url resolves', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchDepsDevScores([null, 'https://gitlab.com/foo/bar'])).toEqual([null, null]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return the Maintained score for a resolvable GitHub repo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(scorecardResponse(8)));
    expect(await fetchDepsDevScores(['https://github.com/foo/bar'])).toEqual([8]);
  });

  it('should request the url-encoded deps.dev project endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(scorecardResponse(8));
    vi.stubGlobal('fetch', fetchMock);
    await fetchDepsDevScores(['git+https://github.com/foo/bar.git']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deps.dev/v3/projects/github.com%2Ffoo%2Fbar',
    );
  });

  it('should keep results aligned to the input when some urls are absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(scorecardResponse(3)));
    expect(
      await fetchDepsDevScores(['https://github.com/a/b', null, 'https://github.com/c/d']),
    ).toEqual([3, null, 3]);
  });

  it('should return null when the project has no scorecard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    expect(await fetchDepsDevScores(['https://github.com/foo/bar'])).toEqual([null]);
  });

  it('should return null when there is no Maintained check', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ scorecard: { checks: [{ name: 'Code-Review', score: 7 }] } }),
      }),
    );
    expect(await fetchDepsDevScores(['https://github.com/foo/bar'])).toEqual([null]);
  });

  it('should treat a negative score (check did not run) as no signal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(scorecardResponse(-1)));
    expect(await fetchDepsDevScores(['https://github.com/foo/bar'])).toEqual([null]);
  });

  it('should return null when deps.dev responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    expect(await fetchDepsDevScores(['https://github.com/foo/bar'])).toEqual([null]);
  });

  it('should degrade a single failed request to null without losing the batch', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(scorecardResponse(2))
        .mockRejectedValueOnce(new Error('network down')),
    );
    expect(await fetchDepsDevScores(['https://github.com/a/b', 'https://github.com/c/d'])).toEqual([
      2,
      null,
    ]);
  });
});

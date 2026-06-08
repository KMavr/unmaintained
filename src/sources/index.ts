import { pLimit, type Limiter } from '../lib/pLimit.js';
import type { Sources } from '../types.js';
import { fetchDepsDevScores } from './depsDev.js';
import { fetchGitHubRepo, fetchGitHubReposGraphQL, GitHubRateLimitError } from './github.js';
import { fetchNpmPackage } from './npmRegistry.js';

const CONCURRENCY = 10;

export interface SourceDiagnostics {
  gitHubRateLimited: number;
}

const countingRateLimit = async <T>(
  diagnostics: SourceDiagnostics,
  count: number,
  fallback: T,
  fetchRepos: () => Promise<T>,
): Promise<T> => {
  try {
    return await fetchRepos();
  } catch (error) {
    if (error instanceof GitHubRateLimitError) {
      diagnostics.gitHubRateLimited += count;
    }
    return fallback;
  }
};

const fetchPerRepo = (urls: (string | null)[], diagnostics: SourceDiagnostics, limit: Limiter) =>
  Promise.all(
    urls.map((url) =>
      limit(() => countingRateLimit(diagnostics, 1, null, () => fetchGitHubRepo(url))),
    ),
  );

const fetchBatched = (urls: (string | null)[], diagnostics: SourceDiagnostics, token: string) =>
  countingRateLimit(
    diagnostics,
    urls.filter(Boolean).length,
    urls.map(() => null),
    () => fetchGitHubReposGraphQL(urls, token),
  );

export const createDefaultSources = (
  token?: string,
): { sources: Sources; diagnostics: SourceDiagnostics } => {
  const diagnostics: SourceDiagnostics = { gitHubRateLimited: 0 };
  const sources: Sources = {
    fetchPackages: async (names) => {
      const limit = pLimit(CONCURRENCY);
      const npmResults = await Promise.all(names.map((name) => limit(() => fetchNpmPackage(name))));
      const urls = npmResults.map(({ repositoryUrl }) => repositoryUrl);

      const [repos, scores] = await Promise.all([
        token ? fetchBatched(urls, diagnostics, token) : fetchPerRepo(urls, diagnostics, limit),
        fetchDepsDevScores(urls, limit),
      ]);

      return npmResults.map((npm, i) => ({
        ...npm,
        archived: repos[i]?.archived ?? null,
        lastCommit: repos[i]?.lastCommit ?? null,
        topics: repos[i]?.topics ?? [],
        openIssues: repos[i]?.openIssues ?? null,
        closedIssues: repos[i]?.closedIssues ?? null,
        repoCreatedAt: repos[i]?.repoCreatedAt ?? null,
        scorecardMaintained: scores[i],
      }));
    },
  };

  return { sources, diagnostics };
};

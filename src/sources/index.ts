import type { Sources } from '../types.js';
import { fetchGitHubRepo, fetchGitHubReposGraphQL, GitHubRateLimitError } from './github.js';
import { fetchNpmPackage } from './npmRegistry.js';

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
      return fallback;
    }
    throw error;
  }
};

const fetchPerRepo = (urls: (string | null)[], diagnostics: SourceDiagnostics) =>
  Promise.all(
    urls.map((url) => countingRateLimit(diagnostics, 1, null, () => fetchGitHubRepo(url))),
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
      const npmResults = await Promise.all(names.map(fetchNpmPackage));
      const urls = npmResults.map(({ repositoryUrl }) => repositoryUrl);

      const repos = token
        ? await fetchBatched(urls, diagnostics, token)
        : await fetchPerRepo(urls, diagnostics);

      return npmResults.map((npm, i) => ({
        ...npm,
        archived: repos[i]?.archived ?? null,
        topics: repos[i]?.topics ?? [],
      }));
    },
  };

  return { sources, diagnostics };
};

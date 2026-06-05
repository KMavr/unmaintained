import type { Sources } from '../types.js';
import { fetchGitHubRepo, fetchGitHubReposGraphQL, GitHubRateLimitError } from './github.js';
import { fetchNpmPackage } from './npmRegistry.js';

export interface SourceDiagnostics {
  gitHubRateLimited: number;
}

const fetchPerRepo = (urls: (string | null)[], diagnostics: SourceDiagnostics) =>
  Promise.all(
    urls.map(async (url) => {
      try {
        return await fetchGitHubRepo(url);
      } catch (error) {
        if (error instanceof GitHubRateLimitError) {
          diagnostics.gitHubRateLimited += 1;
          return null;
        }
        throw error;
      }
    }),
  );

const fetchBatched = async (
  urls: (string | null)[],
  diagnostics: SourceDiagnostics,
  token: string,
) => {
  try {
    return await fetchGitHubReposGraphQL(urls, token);
  } catch (error) {
    if (error instanceof GitHubRateLimitError) {
      diagnostics.gitHubRateLimited += urls.filter(Boolean).length;
      return urls.map(() => null);
    }
    throw error;
  }
};

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

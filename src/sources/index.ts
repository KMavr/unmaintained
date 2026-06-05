import type { Sources } from '../types.js';
import { fetchGitHubRepo, GitHubRateLimitError, GitHubRepo } from './github.js';
import { fetchNpmPackage } from './npmRegistry.js';

export interface SourceDiagnostics {
  gitHubRateLimited: number;
}

export const createDefaultSources = (
  token?: string,
): { sources: Sources; diagnostics: SourceDiagnostics } => {
  const diagnostics: SourceDiagnostics = { gitHubRateLimited: 0 };
  const sources: Sources = {
    fetchPackage: async (name) => {
      const npm = await fetchNpmPackage(name);
      let gitHubRepo: GitHubRepo | null = null;

      try {
        gitHubRepo = await fetchGitHubRepo(npm.repositoryUrl, token);
      } catch (error) {
        if (error instanceof GitHubRateLimitError) {
          diagnostics.gitHubRateLimited += 1;
        } else {
          throw error;
        }
      }

      return {
        ...npm,
        archived: gitHubRepo?.archived ?? null,
        topics: gitHubRepo?.topics ?? [],
      };
    },
  };

  return { sources, diagnostics };
};

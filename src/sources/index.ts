import type { Sources } from '../types.js';
import { fetchGitHubRepo } from './github.js';
import { fetchNpmPackage } from './npmRegistry.js';

export const createDefaultSources = (token?: string): Sources => ({
  fetchPackage: async (name) => {
    const npm = await fetchNpmPackage(name);
    const gitHubRepo = await fetchGitHubRepo(npm.repositoryUrl, token);

    return {
      ...npm,
      archived: gitHubRepo?.archived ?? null,
      topics: gitHubRepo?.topics ?? [],
    };
  },
});

import type { Sources } from '../types.js';
import { fetchArchived } from './github.js';
import { fetchNpmPackage } from './npmRegistry.js';

export const createDefaultSources = (token?: string): Sources => ({
  fetchPackage: async (name) => {
    const npm = await fetchNpmPackage(name);
    const archived = await fetchArchived(npm.repositoryUrl, token);

    return {
      ...npm,
      archived,
    };
  },
});

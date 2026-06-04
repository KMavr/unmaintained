import type { PackageData } from '../types.js';

const REGISTRY = 'https://registry.npmjs.org';

export const fetchNpmPackage = async (name: string): Promise<PackageData> => {
  const res = await fetch(`${REGISTRY}/${name}`);
  if (!res.ok) {
    return {
      name,
      latestVersion: null,
      deprecated: null,
      repositoryUrl: null,
      archived: null,
    };
  }

  const body = (await res.json()) as {
    'dist-tags'?: { latest?: string };
    versions?: Record<string, { deprecated?: string }>;
    repository?: string | { url?: string };
  };

  const latestVersion = body['dist-tags']?.latest ?? null;
  const deprecated = latestVersion ? (body.versions?.[latestVersion]?.deprecated ?? null) : null;
  const repoUrl = typeof body.repository === 'string' ? body.repository : body.repository?.url;

  return {
    name,
    latestVersion,
    deprecated,
    repositoryUrl: repoUrl ?? null,
    archived: null,
  };
};

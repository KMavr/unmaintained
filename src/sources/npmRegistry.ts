import type { PackageData } from '../types.js';

const REGISTRY = 'https://registry.npmjs.org';

export const fetchNpmPackage = async (name: string): Promise<PackageData> => {
  const res = await fetch(`${REGISTRY}/${name}`);
  if (!res.ok) {
    return {
      name,
      latestVersion: null,
      deprecated: null,
    };
  }

  const body = (await res.json()) as {
    'dist-tags'?: { latest?: string };
    versions?: Record<string, { deprecated?: string }>;
  };

  const latestVersion = body['dist-tags']?.latest ?? null;
  const deprecated = latestVersion ? (body.versions?.[latestVersion]?.deprecated ?? null) : null;

  return { name, latestVersion, deprecated };
};

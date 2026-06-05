export interface GitHubRepo {
  archived: boolean;
  topics: string[];
}

export class GitHubRateLimitError extends Error {}

const parseRepo = (repositoryUrl: string): { owner: string; repo: string } | null => {
  const match = repositoryUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  return match ? { owner: match[1], repo: match[2] } : null;
};

export const fetchGitHubRepo = async (
  repositoryUrl: string | null,
  token?: string,
): Promise<GitHubRepo | null> => {
  if (!repositoryUrl) {
    return null;
  }

  const parsed = parseRepo(repositoryUrl);
  if (!parsed) {
    return null;
  }

  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers,
  });

  if (!res.ok) {
    const remaining = res.headers?.get?.('x-ratelimit-remaining');
    if ((res.status === 403 || res.status === 429) && remaining === '0') {
      throw new GitHubRateLimitError(`GitHub rate limit hit for ${parsed.owner}/${parsed.repo}`);
    }

    return null;
  }

  const body = (await res.json()) as { archived?: boolean; topics?: string[] };

  return {
    archived: body.archived ?? false,
    topics: body.topics ?? [],
  };
};

const parseRepo = (repositoryUrl: string): { owner: string; repo: string } | null => {
  const match = repositoryUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  return match ? { owner: match[1], repo: match[2] } : null;
};

export const fetchArchived = async (
  repositoryUrl: string | null,
  token?: string,
): Promise<boolean | null> => {
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
    return null;
  }

  const body = (await res.json()) as { archived?: boolean };
  return body.archived ?? null;
};

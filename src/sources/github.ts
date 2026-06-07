export interface GitHubRepo {
  archived: boolean;
  topics: string[];
  lastCommit: string | null;
  openIssues: number | null;
  closedIssues: number | null;
  repoCreatedAt: string | null;
}

export class GitHubRateLimitError extends Error {}

const throwIfRateLimited = (res: Response, message: string): void => {
  const remaining = res.headers?.get?.('x-ratelimit-remaining');
  if ((res.status === 403 || res.status === 429) && remaining === '0') {
    throw new GitHubRateLimitError(message);
  }
};

export const parseRepo = (repositoryUrl: string): { owner: string; repo: string } | null => {
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
    throwIfRateLimited(res, `GitHub rate limit hit for ${parsed.owner}/${parsed.repo}`);
    return null;
  }

  const body = (await res.json()) as {
    archived?: boolean;
    topics?: string[];
    pushed_at?: string;
    created_at?: string;
  };

  return {
    archived: body.archived ?? false,
    topics: body.topics ?? [],
    lastCommit: body.pushed_at ?? null,
    openIssues: null,
    closedIssues: null,
    repoCreatedAt: body?.created_at ?? null,
  };
};

const TOPICS_FIELDS = `
  repositoryTopics(first: 20) {
    nodes {
      topic {
        name
      }
    }
  }
`;

const ISSUE_FIELDS = `
  openIssues: issues(states: OPEN) {
    totalCount
  }

  closedIssues: issues(states: CLOSED) {
    totalCount
  }
`;

const METADATA_FIELDS = `
  isArchived
  pushedAt
  createdAt
`;

const REPOSITORY_FIELDS = [METADATA_FIELDS, TOPICS_FIELDS, ISSUE_FIELDS].join('\n');

const buildRepositoryQuery = (alias: string, owner: string, repo: string): string => `
  ${alias}: repository(
    owner: ${JSON.stringify(owner)}
    name: ${JSON.stringify(repo)}
  ) {
    ${REPOSITORY_FIELDS}
  }
`;

export const fetchGitHubReposGraphQL = async (
  repositoryUrls: (string | null)[],
  token: string,
): Promise<(GitHubRepo | null)[]> => {
  const targets = repositoryUrls
    .map((url, index) => ({
      index,
      parsed: url ? parseRepo(url) : null,
    }))
    .filter(
      (target): target is { index: number; parsed: { owner: string; repo: string } } =>
        target.parsed !== null,
    );

  if (targets.length === 0) {
    return repositoryUrls.map(() => null);
  }

  const body = targets
    .map(({ index, parsed }) => buildRepositoryQuery(`r${index}`, parsed.owner, parsed.repo))
    .join('\n');

  const query = `query { ${body} }`;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throwIfRateLimited(res, 'GitHub GraphQL rate limit hit');
    return repositoryUrls.map(() => null);
  }

  const json = (await res.json()) as {
    data?: Record<
      string,
      {
        isArchived: boolean;
        pushedAt: string | null;
        openIssues: { totalCount: number };
        closedIssues: { totalCount: number };
        createdAt: string | null;
        repositoryTopics: { nodes: { topic: { name: string } }[] };
      } | null
    >;
    errors?: { type?: string }[];
  };

  if (json.errors?.some((e) => e.type === 'RATE_LIMITED')) {
    throw new GitHubRateLimitError('GitHub GraphQL rate limit hit');
  }

  return repositoryUrls.map((_url, index) => {
    const node = json.data?.[`r${index}`];

    return node
      ? {
          archived: node.isArchived,
          lastCommit: node.pushedAt ?? null,
          topics: node.repositoryTopics.nodes.map(({ topic }) => topic.name),
          repoCreatedAt: node.createdAt ?? null,
          openIssues: node.openIssues.totalCount,
          closedIssues: node.closedIssues.totalCount,
        }
      : null;
  });
};

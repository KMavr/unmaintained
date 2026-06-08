import type { Limiter } from '../lib/pLimit.js';
import { parseRepo } from './github.js';

const fetchScore = async (project: { owner: string; repo: string }): Promise<number | null> => {
  try {
    const projectId = `github.com/${project.owner}/${project.repo}`;
    const res = await fetch(`https://api.deps.dev/v3/projects/${encodeURIComponent(projectId)}`);

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      scorecard?: { checks?: { name: string; score: number }[] };
    };
    const score = data?.scorecard?.checks?.find((check) => check.name === 'Maintained')?.score;

    if (score === undefined || score < 0) {
      return null;
    }
    return score;
  } catch {
    return null;
  }
};

export const fetchDepsDevScores = async (
  urls: (string | null)[],
  limit: Limiter = (fn) => fn(),
): Promise<(number | null)[]> => {
  const projects = urls.map((url) => (url === null ? null : parseRepo(url)));

  return await Promise.all(
    projects.map((project) => (project === null ? null : limit(() => fetchScore(project)))),
  );
};

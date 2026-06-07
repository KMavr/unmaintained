import { parseRepo } from './github.js';

export const fetchDepsDevScores = async (urls: (string | null)[]): Promise<(number | null)[]> => {
  const projects = urls.map((url) => (url === null ? null : parseRepo(url)));

  return await Promise.all(
    projects.map(async (project) => {
      if (project === null) {
        return null;
      }
      try {
        const projectId = `github.com/${project.owner}/${project.repo}`;
        const res = await fetch(
          `https://api.deps.dev/v3/projects/${encodeURIComponent(projectId)}`,
        );

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
    }),
  );
};

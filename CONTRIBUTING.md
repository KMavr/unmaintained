# Contributing

Thanks for your interest in improving `unmaintained`. Issues and PRs are welcome.

## Getting started

```sh
npm install
npm run build      # compile TypeScript to dist/
npm test           # vitest (watch); use `npm test -- --run` for a single pass
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Requires **Node 20+**.

## Project layout

- `src/index.ts` — CLI entry (commander): the bare `unmaintained` command and its flags.
- `src/run.ts` — orchestrator: resolve dependencies → analyze → render → exit code.
- `src/types.ts` / `src/config.ts` — shared types (`Tier`, `Finding`, `Reason`) and default thresholds.
- `src/lib/*` — manifest reading and dependency resolution (direct vs `--transitive`).
- `src/sources/*` — injectable data clients (deps.dev, npm registry, GitHub) behind a `Sources` facade.
- `src/signals/*` — `hard/` (archived, deprecated, unmaintained topic) and `soft/` (commit age, issue
  staleness, release cadence, solo maintainer, OpenSSF Maintained score).
- `src/report/*` — human (chalk) and JSON renderers.
- `tests/` — mirrors `src/`. Sources are injected as fakes, so the suite is fully offline.

## Tests

- Written with Vitest. **No network in unit tests** — pass fake `Sources` into `analyze`/`run`.
- Test descriptions start with **"should"** (e.g. `it('should flag an archived repo', …)`).
- Add tests with every signal, source, or renderer change. Run `npm test -- --run` before pushing.

## Commits & releases

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/); husky +
  commitlint enforce this locally and in CI.
- `feat:` → minor bump, `fix:` → patch, everything else → no release.
- Releases are automated by [release-please](https://github.com/googleapis/release-please): merging a
  `feat:`/`fix:` to `main` opens a release PR; merging that PR tags the version and publishes to npm
  with [provenance](https://docs.npmjs.com/generating-provenance-statements).

## Before you push

```sh
npm run lint && npm run typecheck && npm run format:check && npm test -- --run
```

These are the same checks CI runs on Node 20, 22, and 24.

# unmaintained

[![CI](https://github.com/KMavr/unmaintained/actions/workflows/ci.yml/badge.svg)](https://github.com/KMavr/unmaintained/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/unmaintained.svg)](https://www.npmjs.com/package/unmaintained)
[![npm downloads](https://img.shields.io/npm/dm/unmaintained.svg)](https://www.npmjs.com/package/unmaintained)

> Report which of your dependencies are unmaintained — and which are _probably_ unmaintained — as an advisory check, the way `npm audit` warns at install time.

`unmaintained` is a small CLI that reads your `package.json`, asks a few public data sources whether each dependency still has a pulse, and reports the ones that don't. It sorts findings into two confidence tiers and, by default, exits `0` — it advises, it doesn't gate. Opt into teeth with `--strict`.

## Philosophy

Plenty of tools tell you a dependency is _out of date_. Very few tell you it's _abandoned_ — and the naive heuristic everyone reaches for ("no release in a year") is wrong, because a small, finished library can sit untouched for years and be perfectly healthy. Punishing "done" is how you train people to ignore the warning.

So `unmaintained` is built around two ideas:

- **Tiers map to confidence, not severity.** A package lands in **unmaintained** only on a _hard_ signal — the GitHub repo is archived, npm marks the latest version deprecated, or the repo wears an `unmaintained` / `abandoned` / `no-maintenance-intended` topic. Heuristics (dead release cadence, dormant commits, a stale issue backlog, a solo maintainer, a low OpenSSF "Maintained" score) only ever produce the softer **probably** tier, and only when you ask for it with `--soft`.
- **Absence of data is never a guilty verdict.** If a package has no GitHub repo, or a source is rate-limited, the relevant check returns _no signal_ — it does not count against the package. A blank is a blank, not a conviction.

It's **advisory, not a gate.** Report-only and exit `0` by default; `--strict` makes the **unmaintained** (hard) tier exit `1` for teams that want a CI failure. There's no sidecar, no allowlist, nothing to game — just a fresh read of public data each run.

The tool has **two runtime dependencies** (`commander` and `chalk`) and uses the built-in `fetch`. A tool that scrutinizes _your_ dependency health shouldn't drag in a long tail of its own.

## How this compares

`unmaintained` is not a security scanner, a freshness checker, or a gate. It answers one question the others don't: _is anyone still home?_

- **`npm audit` / Snyk / Socket** flag known _vulnerabilities_. A package can be flawlessly secure and stone dead; a healthy one can have an open CVE. Different question.
- **`npm outdated` / Renovate / Dependabot** tell you a _newer version exists_ and open bump PRs. They say nothing about whether the project behind the package is still maintained — and they'll happily keep bumping an abandoned one.
- **OpenSSF Scorecard** computes a broad basket of supply-chain health metrics. `unmaintained` doesn't reimplement it — it _reads_ Scorecard's "Maintained" score (via [deps.dev](https://deps.dev)) as one soft check among several, and focuses solely on the abandonment question with a clear two-tier verdict.

Best suited for teams who want an occasional, low-noise "which of these should we plan to replace?" signal — without a new gate in the build.

## Install

Install as a dev dependency so the version is pinned in your project and CI runs match local:

```bash
npm install --save-dev unmaintained
# or
pnpm add -D unmaintained
# or
yarn add --dev unmaintained
```

Then invoke via your package manager's runner:

```bash
npx unmaintained            # npm
pnpm unmaintained           # pnpm
yarn unmaintained           # yarn
```

### Alternatives

- **No install** — `npx unmaintained@latest`. Fetched on demand; fine for a one-off look, slower on every CI run than installing.
- **Global install** — `npm install -g unmaintained`. Convenient for ad-hoc use across many projects; not recommended for CI, since the version drifts independently from your repo.

Every release is published from CI with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations, so each version on npm links back to the exact commit and workflow that built it.

Requires Node.js ≥ 20.

## Quickstart

```bash
cd your-project
npx unmaintained                 # hard tier only — archived / deprecated / topic
npx unmaintained --soft          # also show the "probably unmaintained" tier
npx unmaintained --json | jq     # machine-readable output
npx unmaintained --strict        # exit 1 if any hard-tier findings
```

A scan with `--soft` looks like this:

```
✗ request@2.88.2 is unmaintained
    • request is flagged deprecated in its latest version 2.88.2.
    • request's last release was 6.3 years ago (2020-02-11T16:35:36.122Z).
    • request scores 0/10 on the OpenSSF Scorecard "Maintained" check (recent commit and issue activity), at or below the 2/10 floor.

? chalk@5.6.2 is probably unmaintained
    • chalk has a single npm maintainer. Common in open source, but a higher bus-factor risk than projects with several.
```

Clean projects say so and exit `0`:

```
No unmaintained dependencies found.
```

## Flags

| Flag              | Effect                                                                        |
| ----------------- | ----------------------------------------------------------------------------- |
| `--strict`        | Exit `1` when any **unmaintained** (hard-tier) packages are found.            |
| `--soft`          | Also report the **probably unmaintained** tier from heuristic checks.         |
| `--transitive`    | Scan the full installed dependency tree (via `npm ls`), not just direct deps. |
| `--depth <n>`     | Limit `--transitive` scanning to `n` levels (`1` = direct deps only).         |
| `--production`    | Scan only `dependencies` (skip `devDependencies`).                            |
| `--json`          | Emit machine-readable JSON; suppress human output.                            |
| `--token <token>` | GitHub token for higher rate limits (or set `GITHUB_TOKEN`).                  |

The bare argument is the project directory to scan (defaults to `.`).

Under `--transitive`, each finding records the path from a direct dependency down to the package — shown as a dim `via a › b › c` line in the human report and a `path` array in JSON — so you can see _which_ of your direct deps pulled an abandoned package in.

## Checks

A finding's tier is the highest-confidence check that fired. Every check returns _no signal_ when its data is missing, so unknowns never count against a package.

### Hard — the `unmaintained` tier (always on)

| Check                | Source       | Fires when                                                                      |
| -------------------- | ------------ | ------------------------------------------------------------------------------- |
| `deprecated`         | npm registry | The latest published version carries an npm `deprecated` message.               |
| `archived`           | GitHub       | The repository is archived.                                                     |
| `unmaintained-topic` | GitHub       | The repo has an `unmaintained` / `abandoned` / `no-maintenance-intended` topic. |

### Soft — the `probably` tier (opt in with `--soft`)

| Check                  | Source             | Fires when                                                                          |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `cadence`              | npm registry       | No release in the last **2 years**.                                                 |
| `commit-age`           | GitHub             | No commits to the default branch in the last **2 years**.                           |
| `solo-maintainer`      | npm registry       | The package has a single npm maintainer (a bus-factor risk).                        |
| `stale-issues`         | GitHub             | An open-issue ratio ≥ **0.9** on a repo older than 6 months with ≥ 20 total issues. |
| `scorecard-maintained` | deps.dev / OpenSSF | The OpenSSF Scorecard "Maintained" score is **≤ 2 / 10**.                           |

GitHub-backed checks need network access to api.github.com; set `GITHUB_TOKEN` (or `--token`) to lift the unauthenticated rate limit from 60 to 5,000 requests/hour. Thresholds shown are the defaults — see [`src/config.ts`](./src/config.ts).

## Exit codes

| Code | Meaning                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`  | Clean, or advisory findings reported without `--strict`.                                                                                            |
| `1`  | `--strict` set **and** at least one **unmaintained** (hard-tier) finding.                                                                           |
| `2`  | Misuse / runtime error — no readable `package.json`, or the dependency tree couldn't be resolved (`--transitive` without installed `node_modules`). |

Soft-tier findings never change the exit code, even under `--strict`. And a GitHub rate-limit is reported on stderr but **never** fails the build — failing your CI because _we_ got throttled would be hostile.

## CI usage

`unmaintained` is advisory by default, so the simplest wiring just surfaces the report:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: npm ci
- name: Report unmaintained dependencies
  run: npx unmaintained --soft
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # lifts the GitHub rate limit
```

To make it a gate on the hard tier, add `--strict` so an archived or deprecated dependency fails the job:

```yaml
- name: Fail on unmaintained dependencies
  run: npx unmaintained --strict
```

Pinning `unmaintained` in `devDependencies` keeps the version stable across CI runs and matches what you use locally.

## Out of scope

- **Vulnerabilities** — use `npm audit`, Snyk, or Socket.
- **Version freshness / bump PRs** — use `npm outdated`, Renovate, or Dependabot.
- **A configurable gate with waivers** — deliberately omitted. No sidecar, no allowlist; the verdict is a fresh read of public data, not a file you maintain.
- **Running OpenSSF Scorecard itself** — we read its published "Maintained" score via deps.dev, we don't recompute the full Scorecard.

## Status

`unmaintained` is pre-1.0. The two-tier model, flags, and exit codes are stable; thresholds and the exact wording of findings may still change. The `--json` shape is `{ summary, findings[] }`. Bug reports and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Konstantinos Mavrikas

---
name: Bug report
about: unmaintained flags the wrong package, misses one, or errors
title: ''
labels: bug
assignees: ''
---

## What happened

<!-- What did unmaintained report, and what did you expect instead? -->

## Tier reported

- [ ] **Unmaintained** (hard signal — archived / deprecated / unmaintained topic)
- [ ] **Probably unmaintained** (soft signal, shown under `--soft`)
- [ ] Should have been flagged but wasn't
- [ ] Errored / crashed

## Reproduction

**Package(s) involved:** <!-- e.g. request@2.88.2 -->

**Command run:**

```sh
# e.g. npx unmaintained --soft --transitive
```

**Output** (paste the human report, or `--json` output if relevant):

```

```

## Expected vs. actual

- **Expected:** <!-- e.g. "should not flag — package is feature-complete, not abandoned" -->
- **Actual:** <!-- the line(s) you got, or the missing line -->

## Environment

- unmaintained version:
- Node version:
- OS:
- Was `GITHUB_TOKEN` set? <!-- relevant for soft/GitHub-backed signals and rate limits -->

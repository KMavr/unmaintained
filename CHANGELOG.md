# Changelog

## [0.2.0](https://github.com/KMavr/unmaintained/compare/unmaintained-v0.1.0...unmaintained-v0.2.0) (2026-06-08)

### Features

- add npm registry source, deprecated check, and analyze ([69bade5](https://github.com/KMavr/unmaintained/commit/69bade59c18c72d0a6155d2b231e0242b6ea0876))
- read direct dependencies from package.json ([2799667](https://github.com/KMavr/unmaintained/commit/27996676ca3dc6bc5750d75353d9487303f7f09b))
- scan dependencies and report unmaintained packages ([4c54661](https://github.com/KMavr/unmaintained/commit/4c5466156c4253e7a00d3f56b2cf9d8239489867))
- detect archived repositories via GitHub ([752f39c](https://github.com/KMavr/unmaintained/commit/752f39cb07111d7fdd943b6dc82a690f859fb202))
- detect unmaintained repository topics ([9781ea5](https://github.com/KMavr/unmaintained/commit/9781ea5245a532eff3c7c1a753eaad5b3e7427f8))
- add --soft probably tier with release-cadence check ([b98aff8](https://github.com/KMavr/unmaintained/commit/b98aff8701eb2e382ed77382d60f249d83c224a3))
- add solo-maintainer soft check ([2e61d7c](https://github.com/KMavr/unmaintained/commit/2e61d7c9663fe18d3bb0e4cbc77bc368e772a088))
- add commit-age soft check from GitHub push date ([9a95fdc](https://github.com/KMavr/unmaintained/commit/9a95fdc1463e46cc6521334a92cc02149b857c38))
- add stale-issue-backlog soft check (token-only) ([88dced9](https://github.com/KMavr/unmaintained/commit/88dced9fe372a4ab98fd8ae8d95790abae33bf71))
- add OpenSSF Scorecard "Maintained" soft check via deps.dev ([20da8f5](https://github.com/KMavr/unmaintained/commit/20da8f5ef4864519ac5a49cfdeea5ac86c941a7c))
- add --json output ([921131e](https://github.com/KMavr/unmaintained/commit/921131e6514151eaf37f69c980c7c84a0bad0464))
- add --transitive and --depth dependency scanning ([5f674e3](https://github.com/KMavr/unmaintained/commit/5f674e33682d8fd543ba5359bafcbac800491940))
- batch GitHub lookups via GraphQL when a token is set ([31f7c4f](https://github.com/KMavr/unmaintained/commit/31f7c4f292ea58b05c1b9f088330169e408aac4e))
- warn on degraded results when GitHub rate-limits ([af486cb](https://github.com/KMavr/unmaintained/commit/af486cbf1f1a55950beb406c2c2e6632342013d0))

### Bug Fixes

- bound source concurrency and degrade stray network errors to null ([bf274b3](https://github.com/KMavr/unmaintained/commit/bf274b3802e0ffa7e7a981d7793e3182c2754b1e))

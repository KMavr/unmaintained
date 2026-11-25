# Security Policy

## Supported versions

Only the latest published release of `unmaintained` receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub:
[Report a vulnerability](https://github.com/KMavr/unmaintained/security/advisories/new).

Include the affected version, what you did, and what you expected versus what happened. You can
expect an acknowledgement within a few days. Confirmed issues are fixed in a new release and
credited in the advisory unless you prefer otherwise.

## Scope

`unmaintained` reads your `package.json` and queries public data sources (deps.dev, the npm registry
and the GitHub API) over HTTPS. It does not modify your project. Reports about unsafe handling of
those responses, how requests are made or how `GITHUB_TOKEN` is used, or the release pipeline are in
scope.

Every release is published from CI with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations.

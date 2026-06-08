# Example

A minimal project whose [`package.json`](./package.json) declares three dependencies that, between them, exercise both tiers `unmaintained` reports:

| Dependency | Tier                    | Why                                                                          |
| ---------- | ----------------------- | ---------------------------------------------------------------------------- |
| `request`  | **unmaintained** (hard) | npm marks the latest version `2.88.2` deprecated.                            |
| `left-pad` | **unmaintained** (hard) | npm marks the latest version `1.3.0` deprecated.                             |
| `chalk`    | **probably** (soft)     | Not deprecated or archived, but trips heuristic checks shown under `--soft`. |

The hard tier (`request`, `left-pad`) shows on a bare scan. `chalk` only appears once you opt into the soft tier with `--soft`.

## Run it

This example consumes the CLI from the parent repo (`"file:.."`), so build it first:

```sh
# from the repo root
npm install
npm run build

# then, in this folder
cd examples
npm install
npm run scan         # hard tier only — exits 0
npm run scan:soft    # adds the "probably" tier
```

`unmaintained` reads `package.json` and queries public registries, so the basic scan needs network access but not an installed `node_modules`. (A `--transitive` scan would need the tree installed.)

## Expected output

`npm run scan` reports only the hard tier and exits `0` (advisory by default):

```
✗ request@2.88.2 is unmaintained
    • request is flagged deprecated in its latest version 2.88.2.

✗ left-pad@1.3.0 is unmaintained
    • left-pad is flagged deprecated in its latest version 1.3.0.
```

`npm run scan:soft` adds `chalk` under the **probably** tier, plus any soft reasons that also apply to the hard-tier packages:

```
? chalk@5.6.2 is probably unmaintained
    • chalk has a single npm maintainer. Common in open source, but a higher bus-factor risk than projects with several.
```

> Exact ages and OpenSSF scores reflect live data and will differ from run to run — the tiers are what matter.

Neither command fails the build. To turn the hard tier into a gate, add `--strict`:

```sh
npx unmaintained --strict; echo "exit: $?"   # exit: 1 — request and left-pad are deprecated
```

See the [root README](../README.md) for the full check list, flags, and exit codes.

# Contributing to Breakra

Thanks for helping. Breakra is MIT-licensed; by contributing you agree your contribution is released under the same license.

The most useful contributions right now:
1. **Wrong findings.** A change Breakra classified wrongly, or missed. Use the *Report a wrong finding* issue template.
2. **Missing rules.** OpenAPI 3.0 changes Breakra reports as `unknown` but could classify.
3. **Bugs** in validation, limits or the handler.

## Setup

Requires [Bun](https://bun.sh) ≥ 1.4.2.

```bash
git clone https://github.com/danbuildss/breakra && cd breakra
bun install --frozen-lockfile
bun run check   # typecheck, lint, tests, build, smoke test: must pass before a PR
```

Optional: `bun run oracle` cross-checks against [oasdiff](https://github.com/oasdiff/oasdiff) v1.33.0 (needs it on PATH or `OASDIFF=/path`). CI runs it on every PR.

## How the code is organised

| Path | What |
|---|---|
| `src/core/validate.ts` | Request and spec validation, size and `$ref` limits |
| `src/core/compare.ts` | Wrapper around `api-smart-diff` (raw diffs only) |
| `src/core/classify.ts` | **The rules**: every raw diff → a classified finding |
| `src/core/format.ts` | Sorting, ids, output bounds |
| `src/index.ts` | The HTTP handler deployed to Bankr |
| `RULES.md` | The rule table, in words |
| `tests/rules.test.ts` | One test per rule |

## Rules for changes

- **Every classification change needs a test** in `tests/rules.test.ts` and a row in `RULES.md`.
- **Version bumps** (`src/version.ts`): change a rule → bump `RULE_SET_VERSION`; change analysis behaviour or response shape → bump `ENGINE_VERSION`. Then run `bun run examples` and `bun run demo` to regenerate the committed outputs (tests fail if you forget).
- **Wording:** findings say "may break", never "will break", except for a removed operation.
- **Privacy:** never log or echo submitted spec content, in errors or logs.
- **No network access** from the engine. External `$ref`s are never fetched.
- **No new runtime dependencies** without an issue first. The handler ships as one file of at most 92,000 bytes because the host can't install packages, and the build fails above that.
- Keep changes small and focused; one topic per PR.

Out of scope for now (open an issue to discuss rather than a PR): YAML input, OpenAPI 3.1, Swagger 2.0, URL inputs, accounts or dashboards.

## Deployment

Only the maintainer deploys the hosted endpoint, from a merged commit (`docs/DEPLOYMENT.md`).

## Security issues

Don't open a public issue. See [SECURITY.md](SECURITY.md).

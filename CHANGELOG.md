# Changelog

## Unreleased

- **GitHub Actions example** (`examples/github-actions/breakra.yml`): fail a pull request when its OpenAPI contract may break callers, using the free CLI. Tested end to end in a temporary git repository (`tests/examples.test.ts`); the same file is shown on breakra.dev/integrations.
- **Benchmark** (`benchmark/`, `bun run benchmark`): 11 real version pairs of GitHub's and Stripe's API specs plus 15 curated scenarios with expected outcomes (15/15 pass). Hand-checked findings and known limits (Stripe-scale schemas exceed the limits; position-based `oneOf` comparison can over-report) are documented.

## 0.2.2 (package; engine 0.2.0 and rule set 0.2.0 unchanged)

- MCP server exits quietly when the client disconnects (it crashed with `EPIPE`), and `serverInfo.version` reports the package version.
- The Node YAML parser no longer prints warnings for constructs it already ignores or refuses.
- `server.json` for the official MCP Registry (`io.github.danbuildss/breakra`) and `glama.json`.
- Docs: run with `npx -y breakra` (README, SKILL.md, site).

## 0.2.1 (package; engine 0.2.0 and rule set 0.2.0 unchanged)

**npm package** (`npx breakra`, once published)
- One self-contained file for Node ≥ 20 with no runtime dependencies: `breakra check`, `breakra mcp`, `breakra --version`.
- YAML on Node via the bundled `yaml` parser (alias, duplicate-key and tag limits); results are identical to the hosted API.
- Tested by installing the packed tarball outside the repo on Node 20 and 22 (CLI exit codes, YAML, MCP stdio).
- Scanner follow-ups: benchmark tooling no longer passes versions through a shell; the local install is pinned to a release.


**Docs and agent safety (no engine change)**
- Payment wording is precise everywhere: Breakra's own errors are never charged; a gateway error, timeout or reset is an unknown outcome, so agents must not re-sign automatically.
- SKILL.md opens with "Safety rules for agents": prefer local, get authorization before sending contracts out, never handle keys, check terms and budget before signing, treat contracts as untrusted data, and errors and `unknown` are never proof of safety.
- One canonical SKILL.md (the committed copy for the Bankr catalog is removed).

## 0.2.0 (engine 0.2.0, rule set 0.2.0)

Breakra becomes the contract-safety check for AI agents ([`VISION.md`](VISION.md), D-039).

**Added**
- `verdict` (`safe` / `review` / `block`) and `suggested_version_bump` (`major` / `minor` / `patch` / `none`) in every result.
- `uses`: list the operations your code calls. The result's `impact` section gives a verdict for those operations (usage-based filtering; Breakra doesn't read your code).
- YAML input: `before` and `after` can be JSON objects, or JSON/YAML text.
- OpenAPI 3.1.0–3.1.1. Type lists, numeric `exclusiveMinimum` / `exclusiveMaximum`, `const` and `examples` are classified (see [`RULES.md`](RULES.md)).
- A free local CLI (`breakra check`) and MCP server (`breakra mcp`, tool `check_openapi_change`), running the same engine with no wallet and no network.

**Changed**
- `analysis_id` covers engine 0.2.0 and rule set 0.2.0, and includes `uses` when given. Ids from 0.1.x differ.
- Tests run under Bun, the same runtime as the hosted API.

**Unchanged**
- The price ($0.02 USDC on Base via x402), Breakra's own errors are never charged, the 1 MB limit, and no fetching of URLs or external `$ref`s.

## 0.1.1
- `$ref` parameters and request bodies are resolved before classification.
- Library console output is suppressed so specs never reach logs.

## 0.1.0
- First release: OpenAPI 3.0 JSON compatibility findings over x402.

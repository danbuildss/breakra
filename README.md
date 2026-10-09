# Breakra

**Know what changed before your integration breaks.**

Breakra compares two OpenAPI 3.0 contracts and returns structured, evidence-backed compatibility findings for coding agents. It is a single x402-paid endpoint: **$0.02 USDC on Base per analysis**, with errors never charged.

**Status:** live on Bankr x402 Cloud. Every response states its `engine_version` and `rule_set_version`. The owner's trademark search for "Breakra" found no results (2026-10-09); the `breakra.dev` domain is planned.

## Use it

```
POST https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze
{ "before": { …OpenAPI 3.0 JSON… }, "after": { …OpenAPI 3.0 JSON… } }
```

- **Agents:** start with [`SKILL.md`](SKILL.md): when to call it, how to pay safely, and how to read the findings.
- **Contract:** [`openapi.json`](openapi.json). Full field reference: [`docs/API.md`](docs/API.md). Rules: [`RULES.md`](RULES.md).
- **Examples:** [`examples/request.json`](examples/request.json) → [`examples/response.json`](examples/response.json) (a real engine output), a paying client in [`examples/client.ts`](examples/client.ts), and a curl call in [`examples/curl.sh`](examples/curl.sh).

```bash
BREAKRA_KEY_FILE=./wallet.key bun examples/client.ts before.json after.json
```

The client checks the payment terms before signing (exact, Base, USDC, at most $0.02), signs once and never retries with a new payment. Use a dedicated low-balance wallet.

What you get: every change, labelled `breaking`, `potentially_breaking`, `unknown`, `compatible` or `non_contract`, with direction (request/response), location, evidence (before/after values) and a recommended action. Results are deterministic: the same inputs always give the same `analysis_id`.

Not supported in V0: OpenAPI 3.1, Swagger 2.0, YAML, URL inputs, request bodies over 1 MB. External `$ref`s are never fetched.

## Development

Requires [Bun](https://bun.sh) ≥ 1.4.2. CI also uses Go for the oasdiff cross-check.

```bash
bun install --frozen-lockfile
bun run check        # typecheck + lint + tests + build + smoke test of the built handler
bun run examples     # regenerate examples/response.json after an engine change
bun run oracle       # cross-check against oasdiff (needs `oasdiff` v1.33.0 on PATH, or OASDIFF=/path)
bun scripts/bench.ts # benchmarks on real GitHub API spec slices (downloads into .bench/)
```

- Source: `src/` (see ARCHITECTURE.md). Tests: `tests/` (including `docs.test.ts`, which keeps `openapi.json`, `SKILL.md` and the examples in sync with the code).
- `bun run build` writes the Bankr-ready single file to `dist/x402/breakra-analyze/index.ts` (not committed). Deploying follows [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and is done by the owner only.

## Contributing

Issues and PRs are welcome, especially reports of wrong findings (there's an issue template for that). See [CONTRIBUTING.md](CONTRIBUTING.md); security issues go through [SECURITY.md](SECURITY.md).

## Project navigation
- `notes.md`: read first. Running status, dated log and the original owner inputs.
- `CLAUDE.md`: mandatory Claude workflow and guardrails.
- `PRODUCT.md`, `PLAN.md`, `DECISIONS.md`, `TASKS.md`, `TESTING.md`, `LAUNCH.md`: scope, phases, decisions, tasks, test evidence and launch plan.
- `ARCHITECTURE.md`, `BENCHMARKS.md`, `AUDIT.md`: design, performance and the Phase 0 audit.
- `PHASE-1-PLAN.md`, `PHASE-3-PLAN.md`, `T-001-PLAN.md`: phase plans (historical).

## License

[MIT](LICENSE). The built handler bundles [api-smart-diff](https://github.com/udamir/api-smart-diff) (MIT).

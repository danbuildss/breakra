# Breakra

**Know what changed before your integration breaks.**

Breakra is a planned x402-paid utility that compares two OpenAPI contracts and returns structured, evidence-backed compatibility findings for coding agents.

**Current status:** Phase 1 complete. The core engine is built and tested locally and in CI. **Not deployed.** **Name:** Breakra (approved); final domain and trademark clearance pending.

## Project navigation
- `notes.md` — read first: running status, dated log and original owner inputs.
- `AUDIT.md` — Phase 0 feasibility audit (findings, engine bake-off, proposed ADRs).
- `PHASE-1-PLAN.md` — the proposed core-engine build plan.
- `CLAUDE.md` — mandatory Claude workflow and guardrails.
- `PRODUCT.md` — product source of truth and scope.
- `PLAN.md` — phases and approval gates.
- `ARCHITECTURE.md` — proposed backend, API, security and payments.
- `DECISIONS.md` — durable decisions and pending approvals.
- `TASKS.md` — WIP-limited task board.
- `TESTING.md` — quality, security and release gates.
- `LAUNCH.md` — distribution and 14-day commercial test.

## First action
Ask Claude to read `notes.md` and the eight documents, inspect the repository, conduct Phase 0 feasibility only, and present its recommendations for approval. Do not create production code or deploy yet.

## Development

Requires [Bun](https://bun.sh) ≥ 1.4.2. CI also uses Node 22, and Go for the oasdiff cross-check.

```bash
bun install --frozen-lockfile
bun run check        # typecheck + lint + tests + build + smoke test of the built handler
bun run oracle       # cross-check against oasdiff (needs `oasdiff` v1.33.0 on PATH, or OASDIFF=/path)
bun scripts/bench.ts # benchmarks on real GitHub API spec slices (downloads into .bench/)
```

- Source: `src/` (see ARCHITECTURE.md). Tests: `tests/`. Rules: RULES.md. API contract: docs/API.md.
- `bun run build` writes the Bankr-ready single file to `dist/x402/breakra-analyze/index.ts` (not committed). **Deployment is Phase 3 and needs owner approval.**

## Intended V0
One paid `POST /v1/analyze` endpoint, no frontend, no database, no LLM, no continuous monitoring. Initial proposed price $0.02 USDC on Base, subject to owner approval and verified payment integration.

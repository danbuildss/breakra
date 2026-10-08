# Specshift

**Know what changed before your integration breaks.**

Specshift is a planned x402-paid utility that compares two OpenAPI contracts and returns structured, evidence-backed compatibility findings for coding agents.

**Current status:** Feasibility audit; not built or deployed. **Working name:** conflict clearance pending.

## Project navigation
- `CLAUDE.md` — mandatory Claude workflow and guardrails.
- `PRODUCT.md` — product source of truth and scope.
- `PLAN.md` — phases and approval gates.
- `ARCHITECTURE.md` — proposed backend, API, security and payments.
- `DECISIONS.md` — durable decisions and pending approvals.
- `TASKS.md` — WIP-limited task board.
- `TESTING.md` — quality, security and release gates.
- `LAUNCH.md` — distribution and 14-day commercial test.

## First action
Ask Claude to read the eight documents, inspect the repository, conduct Phase 0 feasibility only, and present its recommendations for approval. Do not create production code or deploy yet.

## Intended V0
One paid `POST /v1/analyze` endpoint, no frontend, no database, no LLM, no continuous monitoring. Initial proposed price $0.02 USDC on Base, subject to owner approval and verified payment integration.

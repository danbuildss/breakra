# Breakra — Phase Plan and Status

**Current phase:** 0 — Feasibility audit
**Overall status:** Not implemented
**Last verified:** 2026-10-08. The repo contains docs plus the disposable T-001 probe (`experiments/`). There is no product code.
**Phase 0 status (updated 2026-10-08):** **T-001 complete** (AUDIT §17). Phase 0 is done except for deleting the test endpoints. **Next gate: the owner approves Phase 1 and D-023 to D-026.**
**Earlier Phase 0 status:** Audit approved (D-018 brand Breakra, D-019 ownership/repo, D-020 architecture). Remaining in Phase 0: **T-001 Bankr probe** (prepared; waiting for owner confirmation before deploy or spend). Phase 1 starts only after the T-001 evidence is reviewed and approved.
**Owner approval required to advance:** Yes

## Phase 0 — Feasibility (current)
Deliver: diff-engine comparison with licensing and OpenAPI coverage; support matrix; request/response contract; SSRF plan; host/x402 SDK/facilitator feasibility; payment timing/retry behavior; cost estimate; name-conflict check; go/no-go recommendation.
**Gate:** Owner approves engine, host, V0 scope and repository setup.

## Phase 1 — Core backend
Implement inline-spec validation, normalized comparison, evidence and deterministic compatibility classification. No payment yet.
**Gate:** Fixture-based unit tests pass; unsupported cases clearly marked unknown.

## Phase 2 — Hardening
Add bounded resources, secure URL fetching only if justified and safe, rate/concurrency limits, structured errors, security tests.
**Gate:** Threat model and negative tests reviewed; URL mode may be deferred.

## Phase 3 — x402 + deployment
Integrate verified SDK, receiving address and host. Test unpaid 402, valid payment, failure/retry/settlement and genuine low-budget mainnet payment.
**Gate:** End-to-end paid result confirmed with evidence; no double-settlement claims.

## Phase 4 — Agent distribution
Publish `GET /skill.md`, `GET /openapi.json`, `GET /health`, pricing details, README, examples, marketplace listings where appropriate.
**Gate:** Unfamiliar agent can discover/pay/use without human instructions.

## Phase 5 — 14-day commercial experiment
Targeted demos and outreach; measure external payers, repeat payers, successful paid calls, margin, feedback. No feature expansion during test.
**Gate:** Owner chooses continue / revise / stop from evidence.

## Phase update template
Date | Phase | Verified completed | Evidence (PR/tests/deployment) | Blockers | Next proposed task | Owner approval

Never mark a phase complete based solely on a written plan.

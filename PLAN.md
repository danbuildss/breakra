# Specshift — Phase Plan and Status

**Current phase:** 0 — Feasibility audit
**Overall status:** Not implemented
**Last verified:** 2026-10-08. The repo contains docs only. Phase 0 audit delivered (`AUDIT.md`) and awaiting owner approval of D-013 to D-017 and the name decision.
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

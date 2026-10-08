# Specshift — Task Board

**WIP limit: 1 active implementation task.** Claude may research several alternatives during an approved audit but must not silently implement them.

## Backlog — Phase 0
- [x] Audit maintained OpenAPI diff libraries, compatibility semantics, licenses and runtime fit. (AUDIT.md §3: 14-change fixture plus the 13 MB GitHub spec benchmark)
- [x] Verify supported OpenAPI versions and unsupported constructs. (AUDIT.md §5, proposed)
- [x] Propose final API input/output and error schema. (AUDIT.md §6, draft)
- [x] Decide inline-only vs safe URL mode. (Proposed D-014: inline-only)
- [~] Verify actual x402 SDK, host, facilitator and settlement semantics. (CLI source verified. Settlement, limits and retries are **unknown** until T-001.)
- [x] Estimate worst-case execution cost, latency and $0.02 unit economics. (AUDIT.md §9; the fee figure is reported, not verified)
- [x] Check Specshift naming conflicts. **Conflict found** (AUDIT.md F1); owner decision pending.
- [x] Present feasibility audit and await owner approval. (Delivered 2026-10-08)

## Not started — gated
- [ ] Phase 1 core implementation.
- [ ] Phase 2 security hardening.
- [ ] Phase 3 payments/deployment.
- [ ] Phase 4 agent documentation/distribution.
- [ ] Phase 5 commercial experiment.

## Active task
None. T-000 (Phase 0 audit) was delivered as `AUDIT.md` on 2026-10-08 and is awaiting owner review.

**Recommended next (needs approval):** T-001, the Bankr platform probe. It's a throwaway $0.001 service that measures body size and timeout limits, whether a single-file bundle works, whether non-2xx responses are charged, retry behaviour and outbound fetch. Spend under $0.05. Needs the owner's Bankr login and a wallet holding about $0.10 USDC on Base.

## Task record template
ID | Phase | Goal | Acceptance criteria | Owner approval | Branch/PR | Tests/evidence | Status | Follow-up.

## Definition of done
Implementation merged (if applicable), tests reported honestly, edge cases documented, security/payment implications checked, PLAN updated, next task proposed. No self-declared completion without evidence.

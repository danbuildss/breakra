# Breakra — Task Board

**WIP limit: 1 active implementation task.** Claude may research several alternatives during an approved audit but must not silently implement them.

## Backlog — Phase 0
- [x] Audit maintained OpenAPI diff libraries, compatibility semantics, licenses and runtime fit. (AUDIT.md §3: 14-change fixture plus the 13 MB GitHub spec benchmark)
- [x] Verify supported OpenAPI versions and unsupported constructs. (AUDIT.md §5, proposed)
- [x] Propose final API input/output and error schema. (AUDIT.md §6, draft)
- [x] Decide inline-only vs safe URL mode. (Proposed D-014: inline-only)
- [~] Verify actual x402 SDK, host, facilitator and settlement semantics. (CLI source verified. Settlement, limits and retries are **unknown** until T-001.)
- [x] Estimate worst-case execution cost, latency and $0.02 unit economics. (AUDIT.md §9; the fee figure is reported, not verified)
- [x] Check Specshift naming conflicts. **Conflict found** (AUDIT.md F1). Specshift was rejected; **Breakra was approved (D-018)** after the naming audit (AUDIT.md §12).
- [x] Present feasibility audit and await owner approval. (Delivered 2026-10-08)

## Not started — gated
- [ ] Phase 1 core implementation.
- [ ] Phase 2 security hardening.
- [ ] Phase 3 payments/deployment.
- [ ] Phase 4 agent documentation/distribution.
- [ ] Phase 5 commercial experiment.

## Active task
**T-001 — Bankr platform probe: COMPLETE** (AUDIT §17; cost 0.016 USDC). Both test endpoints **deleted** (Bankr's agent, 2026-10-08; verified by Claude: the schema API returns "Endpoint not found" for both).

**Phase 1, core engine: COMPLETE** (2026-10-08). T-101 to T-108 done. Evidence: TESTING.md (65 tests, oracle, smoke on Bun 1.3.14), BENCHMARKS.md. Delivered as a PR to `main`.

**Merged** as PR #2 (2026-10-08); CI green on the PR and on `main`.

**Next (needs owner approval): Phase 3, deploy and verify on Bankr.** See **`PHASE-3-PLAN.md`** (Phase 2 remainder folded in).

*History:* T-001 was prepared (plan revisions 1–4), approved for execution (D-021), deployed by Bankr's agent, and run by the owner with a burner wallet funded with 0.04 USDC. Full log: `TESTING.md` and `AUDIT.md` §16–17.

**T-000** (Phase 0 audit) is done: `AUDIT.md`, approved via D-018 and D-020.

## Task record template
ID | Phase | Goal | Acceptance criteria | Owner approval | Branch/PR | Tests/evidence | Status | Follow-up.

## Definition of done
Implementation merged (if applicable), tests reported honestly, edge cases documented, security/payment implications checked, PLAN updated, next task proposed. No self-declared completion without evidence.

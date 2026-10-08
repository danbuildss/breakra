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
**T-001 — Bankr platform probe: COMPLETE** (AUDIT §17; cost 0.016 USDC). Remaining: the owner sends BANKR-HANDOFF Message B to delete both test endpoints.

**Next (needs owner approval): Phase 1, core engine.** Scope proposed in the chat on 2026-10-08, with D-023 to D-026.

*(History:* **T-001 — Bankr platform probe: APPROVED FOR EXECUTION (D-021), in progress.** Waiting for Bankr's deploy result and the owner's client outputs. Handoff: `experiments/t001-bankr-probe/BANKR-HANDOFF.md`. (History: PREPARED, plan rev 2.) Bankr's agent deploys (owner's choice). The open conflict on whether failures are charged is the key question (AUDIT §15).
- **Approved:** preparation only (2026-10-08). Max authorized spend $0.05. Disposable; not the product.
- **Plan:** `T-001-PLAN.md`. **Code:** `experiments/t001-bankr-probe/` (bundles with Bun; all cases pass locally).
- **Blocked on owner:**
  1. ✅ Payout wallet confirmed (`0xb98f…fa91`). ✅ Bankr's answers received.
  2. Approve the burner-wallet approach, funded from Rabby `0x9E84…719D` (T-001-PLAN rev 3).
  3. Give explicit go-ahead: Bankr's agent deploys, the owner runs the client and pastes the results.

**T-000** (Phase 0 audit) is done: `AUDIT.md`, approved via D-018 and D-020.

## Task record template
ID | Phase | Goal | Acceptance criteria | Owner approval | Branch/PR | Tests/evidence | Status | Follow-up.

## Definition of done
Implementation merged (if applicable), tests reported honestly, edge cases documented, security/payment implications checked, PLAN updated, next task proposed. No self-declared completion without evidence.

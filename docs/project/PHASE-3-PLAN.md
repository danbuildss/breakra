# Phase 3 — Deploy Breakra on Bankr and Verify Real Payments: Plan for Approval

**Status:** **COMPLETE** (2026-10-08). Approved option A (D-029); limits amended by D-031. Live at v2; V0–V6 verified (TESTING.md); spend $0.06 of the $0.10 cap.
**Starting point:** `main` @ `767b0e7` (Phase 1 merged; CI green on the PR and on `main`).

## Why Phase 2 is folded in

PLAN.md's Phase 2 (hardening) was mostly delivered in Phase 1:
- bounded inputs, including the `$ref`-bomb guard;
- structured free errors;
- security tests;
- no URL mode, so there's no SSRF surface (D-014).

The remaining Phase 2 items are a privacy review of the live logs and timing/memory on Bankr's hardware. Both **need a real deployment**, so they're tasks in this phase (T-303, T-304).

## What happens

| Task | What | Who |
|---|---|---|
| **T-301 Pre-deploy review** | Final check of `dist/bankr.x402.json`: name `breakra-analyze`, **$0.02**, POST only, description and input/output schema. Confirm the payout wallet `0xb98f…fa91`. Write the rollback procedure (`docs/DEPLOYMENT.md`). | Claude |
| **T-302 Deploy** (D-025: Bankr CLI, verbatim upload, **not** via Bankr's agent) | On your Mac: `git pull`, `bun install --frozen-lockfile`, `bun run check`, then `cd dist && bankr x402 deploy breakra-analyze` (after `bankr update`). | **You** (Claude prepares exact commands) |
| **T-303 Verify the live endpoint** | Claude checks the public listing via `api.bankr.bot`. You run a verification client (built from the proven T-001 client: it validates the requirements before signing, signs once per call, never auto-retries, enforces a spend cap) through the cases below. | You run, Claude checks |
| **T-304 Measure and document** | Real timing and memory on Bankr (arm64), and the live log line (check it holds no body or IP). Update API.md (live URL), BENCHMARKS.md (Bankr numbers), TESTING.md, DEPLOYMENT.md, PLAN, TASKS and notes. One PR to `main`. | Claude |

## Live verification cases (T-303)

| # | Call | Expected | Cost |
|---|---|---|---|
| V0 | Unpaid POST | 402: `exact`, `eip155:8453`, USDC, amount **`20000`**, payTo = Bankr router `0x8AEE…01a0` | free |
| V1 | Invalid JSON body (paid attempt) | 400 `INVALID_REQUEST`, **not charged** | free |
| V2 | Swagger 2.0 / OpenAPI 3.1 | 422 `UNSUPPORTED_OPENAPI_VERSION`, not charged | free |
| V3 | `$ref` bomb | 422 `SPEC_TOO_COMPLEX`, fast, not charged | free |
| V4 | Phase 0 bake-off fixture | **200**, 15 changes, `breaking`. **`analysis_id` must equal the local result** (proves the deployed artefact = tested code) | **$0.02** |
| V5 | Largest real pair under the cap (GitHub API 160-path slice, about 1.9 MB) | 200 within budget (target ≤ 20 s, local about 1.7 s). Records real Bankr time and memory | **$0.02** |
| V6 | Balance reconciliation | Burner −0.04; payout +0.04 (fee 0% while under 1,000 calls/month) | — |

**Spend:** 2 charged calls = **$0.04**. The cap in the client is **$0.10** (allows one retry per paid case). Your burner wallet has 0.024 USDC, so it needs **about 0.08 USDC** more from your funding wallet. Nothing else costs money; Bankr covers gas.

## Decisions needed from you

1. **Approve Phase 3** and a spend of up to **$0.10** USDC (top up the burner with about 0.08).
2. **Go public now, or soft-launch?** Every Bankr endpoint is **listed in Bankr's marketplace as soon as it's deployed**, so `breakra-analyze` becomes discoverable immediately. Options:
   - **(A, recommended)** Deploy `breakra-analyze` now. Phase 3 docs and listing stay minimal (a factual description, no marketing). Promotion waits for Phase 4.
   - **(B)** Deploy a temporary `breakra-analyze-staging` first, verify, delete it, then deploy `breakra-analyze`. Safer to undo, but costs an extra deploy and test calls.
3. **Brand caveat:** the domain and trademark checks for Breakra are still open (D-018). The name appears in the endpoint URL and the listing. You decide whether that blocks deploying, or only blocks promotion (Phase 4). Claude recommends it **only blocks promotion**.
4. **License** (MIT recommended) isn't needed to deploy. It's needed before the repo or skill is promoted in Phase 4.

## Exit criteria

- `breakra-analyze` is live at $0.02.
- V0–V6 pass with on-chain evidence.
- The deployed `analysis_id` matches the local one.
- Bankr timing and memory are recorded and within budget.
- The log line has no body or IP.
- The rollback procedure is documented.
- The docs and PR are merged.

## Rollback (to be finalized in T-301)

`bankr x402 pause breakra-analyze` (stops new calls immediately), or redeploy the previous `dist/` from a known-good commit via the CLI. Bankr has no built-in version rollback, so **always deploy from a tagged commit.**

# Phase 5 — 14-Day Commercial Experiment

**Status:** APPROVED (D-033, 2026-10-08). Step 1 (preparation) in progress. **Day 1 waits on the owner's domain and trademark check.**
**Starting point:** live v3 (`main` @ `b079a20`), public repo (MIT), SKILL.md verified by a cold-agent paid run (Phase 4).

## Question
Will people other than the owner pay $0.02 for Breakra, and come back?

## Step 0 — Gate (owner)
- Registrar check for breakra.com / breakra.dev, and a trademark search (USPTO, EUIPO, WIPO) for "Breakra" in software/API classes.
- Buying a domain is optional and not needed for the experiment.

## Step 1 — Preparation (Claude, about $0.02)
| Task | Deliverable |
|---|---|
| T-501 | D-033, this plan, `EXPERIMENT.md` |
| T-502 | Real-world demo: GitHub's REST API description, Dec 2025 → Oct 2026 (`demo/`), verified live once |
| T-503 | `scripts/metrics.ts`: on-chain paid calls, external and repeat wallets, gross USDC, self-pay separated |
| T-504 | Launch drafts in `launch/`: X posts, GitHub repo topics and README demo link, directory submissions |

## Step 2 — The 14 days
- Day 1 starts when the owner posts the first launch material.
- The owner posts and submits; Claude never does.
- Every day or few days the owner runs `bun run metrics` and pastes the output; Claude records it in `EXPERIMENT.md` and notes feedback and sources.
- No features, no price or limit changes. Urgent fixes only, with approval.

## Step 3 — Decision on day 14
Claude writes an evidence report; the owner decides:
- **Continue:** at least 3 external wallets that each paid on 2+ different UTC days, results trusted, margins work.
- **Revise:** usage or feedback shows one specific, fixable obstacle (e.g. 1 MB limit, YAML, OpenAPI 3.1, price).
- **Stop:** targeted distribution brings no meaningful paying demand.

## Known measurement limits
- Payments are read on-chain: payer → Bankr router, router → payout, in one transaction. The payout wallet also receives income from the owner's other Bankr services; Breakra calls are identified by the $0.02 gross amount, and cross-checked with `bankr x402 revenue breakra-analyze`.
- Unpaid 402s and free errors are not visible on-chain. Bankr's dashboard shows request counts.
- Wallets are not people.

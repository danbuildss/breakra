# Breakra — Launch and Commercial Experiment

## Before public launch
- [x] Confirm Breakra can be used publicly: owner's trademark search found no results (2026-10-09); `breakra.dev` registered by the owner (Namecheap). breakra.com not checked.
- [x] Public materials are branded **Breakra only**. No "Built by Somehow" or similar attribution unless the owner explicitly approves it (D-019).
- [x] Repository public and documented; license approved (MIT, D-032).
- [x] Analysis works with representative fixtures (Bankr gives one URL per service, so the path is `/breakra-analyze`, not `/v1/analyze`; D-029). Live: bake-off, GitHub API slices, Orders example, GitHub demo.
- [x] x402 Base USDC payment verified with real low-budget settlement (Phases 3–5, reconciled on-chain).
- [x] `/skill.md` and `/openapi.json` available at breakra.dev (D-032, D-037). No `/health`: a static site can't truthfully report API health.
- [x] Error behavior, rate limits, cost, privacy and rollback documented (docs/API.md, SECURITY.md, docs/DEPLOYMENT.md).
- [x] Pricing and receiving wallet approved by owner (D-011, payout wallet).

## Distribution assets
One clear demo using two real, permissible public OpenAPI versions: source links, exact before/after contract change, JSON output, how a coding agent would use it, known limits. Short README example and one minimal agent integration. Avoid generic 'AI-powered' marketing and false proof-of-work.

## 14-day experiment
Target developers/agents that maintain external API integrations; share demos and direct outreach. Directory listing is distribution, not evidence of demand. No unapproved feature expansion during the experiment.

## Daily metrics
Date | Valid requests | Confirmed paid calls | External paying wallets | Repeat paying wallets | Gross USDC | Estimated cost | Failures | Feedback/source.

Self-pay tests are counted separately from organic paid usage. Never equate wallet addresses with distinct people.

## Decision after 14 days
**Continue** if independent payers repeat, utility is trusted and margins work.
**Revise** if evidence identifies a specific solvable friction.
**Stop** if targeted distribution yields no meaningful paying demand or economics/security are unacceptable.

## Growth guardrails
No token, extra SaaS features, monitoring scheduler, dashboard or unrelated integrations to manufacture activity. Solve the single task well first.

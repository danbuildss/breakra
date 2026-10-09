# Breakra — Product Source of Truth

**Name:** Breakra (approved D-018). It replaces the working name Specshift, rejected because a same-category product already uses that name. Final domain and trademark clearance is still open.
**Brand:** Independently branded. Public materials say **Breakra** only, with no "Built by Somehow" or similar attribution unless the owner approves it (D-019).
**Business owner:** Somehow (the owner's company), for business ownership and administration only.
**Code:** The owner's personal GitHub account `danbuildss`. Proposed repo: `danbuildss/breakra` (D-019).
**Tagline:** Know what changed before your integration breaks.
**Status:** Concept approved; backend not yet built.

## Job to be done
Coding agents maintaining third-party integrations need an actionable, evidence-backed comparison between two versions of an API contract. Breakra accepts two OpenAPI specifications and returns what changed, compatibility risk, evidence and review actions.

## Audience
Primary: autonomous coding agents and developers maintaining external API integrations. Secondary: CI and integration maintenance scripts.

## V0 promise
One x402-paid `POST /v1/analyze` endpoint. Inputs: two inline OpenAPI 3.0.x JSON specs, and optionally two public HTTPS JSON spec URLs if safe fetch is demonstrably implemented. Outputs: machine-readable changes, compatibility categories, evidence, actionable review hints, engine/rule version, input hashes. Deterministic; no LLM.

## Important boundaries
- V0 does not scrape arbitrary HTML documentation, monitor continuously, maintain snapshots, update source code, or promise runtime compatibility.
- It is a paid utility, not a new company, subscription app or dashboard.
- No frontend before real paid usage demonstrates need.
- Initial experimental price: $0.02 USDC per successful analysis on Base; actual payment/settlement semantics require verification.
- No evidence yet of willingness to pay. Free OpenAPI diff tools are direct substitutes.

## Success criteria
A fresh agent can discover instructions, submit a valid request, complete a genuine x402 payment, obtain an accurate analysis and repeat without manual intervention. Commercial success requires **independent external paying users and repeat use**, not self-paid test transactions or directory traffic.

## Stop conditions
Security risks that cannot be contained, uneconomic cost per paid call, persistent incorrect compatibility claims, or no meaningful external paid demand after a bounded targeted distribution experiment.

## Explicit non-goals
Frontend, auth accounts, subscriptions, LLM, monitoring scheduler, general web scraping, MCP, webhook system, token, CORTX/Luca/MuseCourt integrations, private enterprise API access.

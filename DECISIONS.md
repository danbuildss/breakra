# Specshift — Architecture and Product Decision Log

Decisions are append-only. If superseded, add a new decision referencing the old one; do not silently rewrite history.

## D-001 — Working name Specshift
**Status:** Accepted as working name; clearance pending.
**Why:** Short and directly conveys API specification changes.
**Risk:** Existing uses of the name; verify trademark, packages, repositories and domains before public branding.

## D-002 — Independent repository
**Status:** Superseded by D-008.
**Choice:** `somehow-internet/specshift` if organization and name are available.
**Why:** Isolated releases and security boundaries; not another company.

## D-003 — Backend before frontend
**Status:** Accepted.
**Choice:** No frontend in V0; agent skill and API docs are the interface.

## D-004 — One paid operation
**Status:** Accepted.
**Choice:** `POST /v1/analyze` comparing two supplied OpenAPI contracts. No monitoring or historical snapshots in V0.

## D-005 — Deterministic core
**Status:** Accepted.
**Choice:** No LLM or DB in V0. Prefer maintained comparison library after feasibility audit.

## D-006 — Experimental payment price
**Status:** Proposed for test; requires launch approval.
**Choice:** $0.02 USDC on Base per successful analysis, subject to verified SDK behavior and economics.

## D-007 — URL fetching
**Status:** Conditional.
**Choice:** Inline specs are mandatory; remote HTTPS JSON specs only if SSRF defenses are demonstrably robust.

## D-008 — Canonical repository is danbuildss/specshift
**Status:** Accepted. **Date:** 2026-10-08.
**Context:** D-002 proposed `somehow-internet/specshift`, and an earlier draft proposed `somehow-internet/api-change-intelligence`.
**Decision:** The owner confirmed that the canonical repository is `danbuildss/specshift`. It already exists, so no repository needs creating.
**Consequences:** Supersedes D-002. Project docs live in the repo root (not `docs/` as the master brief's tree suggested).

## D-009 — Name origin and company/repo relationship
**Status:** Accepted. **Date:** 2026-10-08.
**Context:** An earlier draft called the product "API Change Intelligence".
**Decision:** The owner renamed it to Specshift because the old name isn't brandable. The product scope is unchanged. Somehow Internet is the owner's company and owns the product. The code lives on the owner's personal GitHub account (`danbuildss/specshift`, see D-008).
**Consequences:** Name-conflict clearance (D-001) still applies before public branding.

## D-010 — Host is Bankr
**Status:** Accepted (owner decision). **Date:** 2026-10-08.
**Decision:** Specshift will be deployed on Bankr's x402 hosting.
**Consequences:** Phase 0 must verify Bankr's actual runtime, x402 SDK/facilitator, limits and settlement semantics, and design around them. If a hard incompatibility is found, report it to the owner rather than silently switching hosts.

## D-011 — Price approved at $0.02
**Status:** Accepted (owner decision). **Date:** 2026-10-08. Supersedes the "proposed" status of D-006.
**Decision:** $0.02 USDC per successful analysis on Base.

## D-012 — Phase 0 approved
**Status:** Accepted. **Date:** 2026-10-08.
**Decision:** The owner approved starting the Phase 0 feasibility audit. It is research and documentation only: no production code, infrastructure or deployment.
**Pending from owner:** Receiving wallet address(es). The owner will send them.

## D-013 to D-017 — Proposed by the Phase 0 audit (see `AUDIT.md` §3–4)
**Status:** Proposed, awaiting owner approval. **Date:** 2026-10-08.
- **D-013:** The diff layer is `api-smart-diff` (pinned and wrapped), with a Specshift-owned classification rules layer. oasdiff is used as a CI-only correctness oracle.
- **D-014:** V0 is inline-only. URL mode is deferred because we can't enforce SSRF controls on Bankr.
- **D-015:** No HTTP framework in production. A single `handler(Request)`, with a build step that bundles `src/` into `x402/analyze/index.ts` (Bankr uploads one file per service).
- **D-016:** Free discovery (`skill.md`, `openapi.json`, pricing) is served from GitHub plus Bankr's built-in schema and discovery. No `/health` or `/ready` endpoint on Bankr, because every Bankr route is paid. This amends brief §13.
- **D-017:** No `@x402/hono` and no facilitator code. Bankr owns verification and settlement.

## Open owner decision — Name conflict (AUDIT.md F1)
PyPI `specshift` (Lethe044, Aug–Sep 2026) is an OpenAPI breaking-change detector: the same name in the same category. The owner must decide whether to keep "Specshift" for public branding or pick another name before launch. Building can continue under the working name.

## New decision template
`D-### — Title` | Status | Date | Context | Options | Decision | Rationale | Consequences | Owner approval/evidence.

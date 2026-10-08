# Breakra — Architecture and Product Decision Log

*(Entries before D-018 were written under the working name Specshift. They stay unchanged because this log is append-only.)*

Decisions are append-only. If superseded, add a new decision referencing the old one; do not silently rewrite history.

## D-001 — Working name Specshift
**Status:** Superseded by D-018 (2026-10-08).
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
**Status:** Accepted in principle by D-020 (2026-10-08). **Date proposed:** 2026-10-08.
- **D-013:** The diff layer is `api-smart-diff` (pinned and wrapped), with a Specshift-owned classification rules layer. oasdiff is used as a CI-only correctness oracle.
- **D-014:** V0 is inline-only. URL mode is deferred because we can't enforce SSRF controls on Bankr.
- **D-015:** No HTTP framework in production. A single `handler(Request)`, with a build step that bundles `src/` into `x402/analyze/index.ts` (Bankr uploads one file per service).
- **D-016:** Free discovery (`skill.md`, `openapi.json`, pricing) is served from GitHub plus Bankr's built-in schema and discovery. No `/health` or `/ready` endpoint on Bankr, because every Bankr route is paid. This amends brief §13.
- **D-017:** No `@x402/hono` and no facilitator code. Bankr owns verification and settlement.

## ~~Open owner decision — Name conflict (AUDIT.md F1)~~ Resolved by D-018
PyPI `specshift` (Lethe044, Aug–Sep 2026) is an OpenAPI breaking-change detector: the same name in the same category. The owner must decide whether to keep "Specshift" for public branding or pick another name before launch. Building can continue under the working name.

## D-018 — Brand is Breakra (replaces Specshift)
**Status:** Accepted (owner decision). **Date:** 2026-10-08. **Supersedes:** D-001.
**Context:** PyPI `specshift` (Lethe044, v1.0.0–1.4.0, Aug–Sep 2026) is an OpenAPI/GraphQL/Protobuf breaking-change detector with a GitHub Action. That's substantially the same functionality under the same name (AUDIT.md F1). The owner rejected Specshift as the public brand.
**Options considered:** Revra, Deltic and Drifto (owner's list). Breakra, Delvra and Contrava (Claude's additions). See AUDIT.md §12. Deltic and Drifto have verified software conflicts. Revra's .com and .dev are held by others and there is a pending REVRA trademark (Class 14).
**Decision:** The product is **Breakra**. Tagline unchanged: "Know what changed before your integration breaks."
**Unresolved (must close before public branding):**
1. breakra.com and breakra.dev showed no DNS (NXDOMAIN), but no authoritative registry or registrar lookup has been possible. RDAP and WHOIS endpoints (Verisign, Google Registry, rdap.org, whois.com, who.is) are blocked from Claude's environment. The **owner must check at a registrar.**
2. No official USPTO, EUIPO or WIPO search has been run. Web aggregators showed no BREAKRA records, but that is not clearance. **The owner or counsel should search Classes 9 and 42.**
3. The npm, PyPI and crates names and the GitHub handle `breakra` were free at check time (2026-10-08). **Not reserved.** Nothing is registered or purchased without owner approval.

## D-019 — Ownership, repository and brand separation
**Status:** Accepted (owner decision). **Date:** 2026-10-08. **Refines:** D-008, D-009.
**Decision:**
- **GitHub owner:** `danbuildss` (the owner's personal account, where the owner builds and maintains products).
- **Proposed repository:** `danbuildss/breakra`. **Never `somehow-internet/breakra`.** Don't assume products live under a Somehow GitHub org.
- **Product identity:** Breakra, independently branded.
- **Company:** Somehow (Somehow Internet), referenced only for business ownership and administration.
- **Public materials:** no "Built by Somehow" or similar attribution unless the owner explicitly approves it.
- **Repo changes:** no repo rename, transfer or creation without first showing the exact proposed GitHub change and getting approval.
**Conflict noted:** The owner's same message also contained an older brief text naming "Parent organization: Somehow Internet" and `somehow-internet/breakra`. The owner's explicit correction overrides it (per CLAUDE.md precedence).
**Observed 2026-10-08 (not acted on):** The session remote is `github.com/danbuildss/specshift`. `git ls-remote https://github.com/danbuildss/breakra` returns the **same HEAD SHA** (`141011b`), while a nonexistent repo name fails. This suggests the repository may **already have been renamed** to `breakra` on GitHub, with the old name redirecting. Claude did not rename anything. The owner should confirm.

## D-020 — Phase 0 architecture approved (D-013 to D-017)
**Status:** Accepted (owner decision). **Date:** 2026-10-08.
**Decision:** Approved in principle, as defined in AUDIT.md:
1. Bankr x402 Cloud is the hosting and payment platform.
2. Bankr verifies and settles payments. No separate payment processor.
3. Modular TypeScript in GitHub, bundled into a single Bankr-compatible handler.
4. Inline OpenAPI specs only in V0. No remote URL fetching.
5. No web framework unless a demonstrated need appears.
6. `api-smart-diff` as the comparison engine, subject to the audit's findings.
7. Breakra-owned deterministic classification rules. Never trust library labels.
8. `oasdiff` as an independent reference in automated tests where practical.
9. No frontend, dashboard, login, database, scheduler or LLM in V0.

Price hypothesis stays at $0.02 USDC per successful analysis (D-011). No scope expansion.
**Pending verification by T-001:** D-016 (free discovery off Bankr). The marketplace shows at least one service listed at price `0` (AUDIT.md §13), so free routes on Bankr may be possible after all. If T-001 confirms it, D-016 will be revisited through a new ADR.

## New decision template
`D-### — Title` | Status | Date | Context | Options | Decision | Rationale | Consequences | Owner approval/evidence.

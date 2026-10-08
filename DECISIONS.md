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
**Observed 2026-10-08 (not acted on):** **Verified:** the git push of `d00fcde` returned `This repository moved. Please use the new location: https://github.com/danbuildss/breakra.git`. **The rename to `danbuildss/breakra` has already happened on GitHub** (not by Claude). Earlier signal: The session remote is `github.com/danbuildss/specshift`. `git ls-remote https://github.com/danbuildss/breakra` returns the **same HEAD SHA** (`141011b`), while a nonexistent repo name fails. This suggests the repository may **already have been renamed** to `breakra` on GitHub, with the old name redirecting. Claude did not rename anything. The owner should confirm.

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

## D-021 — T-001 execution approved
**Status:** Accepted (owner: "approve and go"). **Date:** 2026-10-08.
**Decision:** Run T-001 per `T-001-PLAN.md` rev 3:
- Bankr's agent deploys `breakra-t001-probe` ($0.001) and, separately, `breakra-t001-free` ($0) to payout wallet `0xb98f0de777eea8c481b64e33d3e0066cea38fa91`.
- The owner runs `t001.ts` with a burner wallet funded with 0.04 USDC from Rabby `0x9E8415109A718de3A4653e4DA37C5906df7C719D`.
- Max 30 paid calls, max $0.03 in payments (authorization ceiling $0.05).
- The hard stop rules in the plan apply.
- Deleting the endpoints afterwards needs a separate owner confirmation.

## D-022 — T-001 revision 4: no Bankr-side npm installs; D-016 confirmed
**Status:** Accepted under D-021's T-001 authority (no scope or spend change). **Date:** 2026-10-08.
**Context:**
- The probe deploy with an npm dependency failed to build on Bankr (cause unknown).
- Price 0 was rejected (minimum $0.000001).

**Decision:**
- T-001 endpoints ship with **no npm dependencies**. The library test uses a pre-bundled single file (the D-015 model).
- **D-016 is confirmed:** free discovery can't be a $0 Bankr route.

## D-023 to D-026 — Proposed from T-001 evidence (AUDIT §17)
**Status:** Accepted by D-027 (2026-10-08). **Date:** 2026-10-08.
- **D-023, error semantics:** return **4xx for every invalid input** (free for the caller, verified). **Return 2xx only when the analysis is complete**, because 2xx is what triggers the charge. Never return 2xx with an error payload.
- **D-024, limits:** request body **≤ 2 MB** (before + after combined), returning Breakra's own 413 JSON above that. Handler time budget **≤ 20 s** worst case. Nesting-depth and complexity caps are to be set by benchmark.
- **D-025, packaging and deploy:** ship **one pre-bundled file** with **no npm dependencies**, ending in a literal `export default async function handler(req: Request)`. Deploy with the **Bankr CLI** (`bankr x402 deploy`), never by passing the file to Bankr's agent by URL. Run a paid post-deploy smoke test.
- **D-026, metrics and privacy:** count unique and repeat paying wallets via the `x-402-payer` header. **Never log `x-forwarded-for`** or request bodies. Docs must not promise a payment receipt (Bankr sends none).

## D-027 — Phase 1 approved
**Status:** Accepted (owner: "Approve"). **Date:** 2026-10-08.
**Decision:** Execute `PHASE-1-PLAN.md` (T-101 to T-108). D-023 to D-026 are accepted. There's no payment, deployment or spend in Phase 1. It's delivered as one PR to `main` for owner review.

## D-028 — Phase 1 implementation choices
**Status:** Accepted under D-027's Phase 1 authority (no scope, contract or spend change; reported to the owner in the Phase 1 PR). **Date:** 2026-10-08.
1. **Limits calibrated** (BENCHMARKS.md):
   - `maxExpandedNodes` lowered from 1.5 M to **400 k**. A ref bomb under the old cap used 430 MB RSS; real specs at the 2 MB cap expand to about 135 k.
   - Response bounded to **500 listed changes** and **1,000-char evidence values** (Lambda's ~6 MB response limit).
2. **Ref-bomb guard:** an expanded-size estimate runs before the diff, because a 2 KB spec produced about 200 k diffs in the raw library.
3. **Classification principle:** request narrowing / response widening (RULES.md). The library's labels are discarded entirely.
4. **Toolchain:** Bun 1.4.2 builds (lockfile v2). CI smoke-tests the built file under **Bun 1.3.14** (Bankr's runtime), because Bun 1.3.14 can't read lockfile v2. Vitest, Biome and TypeScript 5.9 are pinned exactly.
5. **oasdiff v1.33.0** is the CI oracle. 3 documented differences, where Breakra is stricter per brief §10.
6. **Dangling local `$ref`s** are rejected (422, free) rather than reported as unknown.

## D-029 — Phase 3 approved, option A
**Status:** Accepted (owner: "approve Phase 3, option A"). **Date:** 2026-10-08.
**Decision:**
- Execute `PHASE-3-PLAN.md`. Deploy **`breakra-analyze`** directly at $0.02 (no staging endpoint). It will appear in Bankr's marketplace, but there's **no promotion until Phase 4**.
- Spend cap **$0.10** USDC from the burner wallet.
- Open brand clearance blocks promotion, not deployment (Claude's recommendation, accepted with option A).
- Payment `payTo` is Bankr's router `0x8AEE…01a0`, as approved in T-001.
- Deploy with the Bankr CLI (D-025).

## New decision template
`D-### — Title` | Status | Date | Context | Options | Decision | Rationale | Consequences | Owner approval/evidence.

# Breakra — Working Notes

*(Formerly "Specshift": rejected as a brand on 2026-10-08, see D-018. The appendices keep the original owner inputs verbatim, including the old name.)*

> **WORKFLOW RULE (always):** Before building, integrating or changing anything, read this file first to know where we are. Every decision, input and step we take gets recorded here.
>
> **Then follow `CLAUDE.md`** (the operating manual). It requires reading PRODUCT → PLAN → DECISIONS → ARCHITECTURE → TASKS → TESTING → LAUNCH, inspecting the repo, and then doing one approved task at a time. Doc precedence: owner's latest explicit decision > DECISIONS.md > PRODUCT.md > ARCHITECTURE.md > PLAN.md > task notes.

---

## Current status

- **Repo:** The session remote is `danbuildss/specshift`. **Proposed: `danbuildss/breakra`** (D-019); it may already be renamed on GitHub (AUDIT §13 P3). Never `somehow-internet/*`.
- **Company:** Somehow (Somehow Internet) is the owner's company, for business and admin only. **Breakra is independently branded. No "Built by Somehow" attribution without approval** (D-019).
- **Name:** **Breakra** (D-018). History: "API Change Intelligence" (not brandable), then "Specshift" (rejected; a same-category competitor), then Breakra. Domain and trademark clearance is still open.

- **Phase:** 0. Audit approved (D-018/019/020). **T-001 Bankr probe is prepared but not executed** (`T-001-PLAN.md`). No product code exists.
- **Project workspace:** The owner's 9 docs are installed in the repo root: CLAUDE, README, PRODUCT, PLAN, ARCHITECTURE, DECISIONS, TASKS, TESTING, LAUNCH.
- **Next step:** The owner confirms the T-001 plan items (Bankr account, payout wallet, `BANKR_API_KEY` secret, funding the payer wallet), then gives explicit go-ahead. Then Claude runs T-001.
- **Waiting on:** The owner's T-001 confirmations, plus the registrar and trademark checks for breakra.com/.dev.

## Inputs received

| # | Date | What | Where |
|---|------|------|-------|
| 1 | 2026-10-08 | Specshift Master Product & Engineering Brief v1.0 | [Appendix A](#appendix-a--specshift-master-product--engineering-brief-v10) |
| 3 | 2026-10-08 | Project workspace zip (9 Markdown files) plus a suggested first message to Claude | Repo root; see [Appendix C](#appendix-c--project-workspace-input-3) |
| 2 | 2026-10-08 | Owner's cover document. It wraps the same master brief and adds: product decisions table, pre-start findings, owner checklist, build order, and an earlier "API Change Intelligence" draft with rules for Claude | [Appendix B](#appendix-b--owners-cover-document-input-2) |

## Key takeaways (summary of input #1)

- **What it is:** One paid HTTP endpoint (`POST /v1/analyze`). It compares two OpenAPI 3.0.x contracts and returns deterministic JSON. The JSON lists changes with evidence and rates each one `compatible` / `potentially_breaking` / `breaking` / `unknown`.
- **Who it's for:** Mainly autonomous coding agents, then developers and CI.
- **Payment:** x402 v2, USDC on Base mainnet, $0.02 per successful analysis. This price is a hypothesis to test, not a validated price. No accounts or logins.
- **V0 constraints:** No frontend, no LLM, no database, no scheduler. Reuse a maintained diff engine rather than building a custom one.
- **Inputs:** Specs sent inline as JSON, or as HTTPS URLs. URL mode is hostile input and needs full SSRF protection. Shipping inline-only first is acceptable.
- **Free endpoints:** `/health`, `/ready`, `/skill.md`, `/openapi.json`, `/pricing`.
- **Honesty rules:** Never fabricate findings, confidence, compatibility guarantees or payment or settlement status. Never claim refunds are automatic.
- **Process:** Read docs, inspect the code, plan the smallest change, implement only the approved scope, test, document, report, then wait for approval before the next phase.
- **First real assignment (not started):** A feasibility audit (Brief §25). It needs to cover the diff engine, support matrix, API contract, classification rules, URL security, hosting, x402 integration, retry behaviour, licensing, cost per request, testing, repo setup, milestones, risks and the name conflict check.
- **Success test:** A 14-day validation period after launch. Outcome is continue, revise or stop, based on real external paying wallets and repeat usage.

## Key takeaways (new in input #2)

- **Same master brief.** The brief inside input #2 matches Appendix A, so I didn't save it twice.
- **Name is a working name.** The owner found a Python package named `specshift` on PyPI (published Sept 2026, linked to an existing GitHub repo). Use "Specshift" as the working name. Before any public branding, check conflicts, trademarks, domains and GitHub. *(Claude has not verified the PyPI finding yet.)*
- **Diff engine:** Don't write one from scratch. OpenAPITools/openapi-diff is **Java**, so compare it against TypeScript alternatives before choosing.
- **x402:** The official x402 Foundation SDK has TypeScript packages, including a Hono integration. Use the official implementation, not a custom payment protocol.
- **Architecture:** Keep the comparison engine independent of payments, so the engine can be tested fully before x402 is wired in.
- **Hard decisions already made:** separate GitHub repo (yes), backend before frontend (yes), dedicated VPS (no), database (not in V0), AI model (not in V0), one paid operation. No separate company or token for this, and it must not grow into another Luca, CORTX or MuseCourt.
- **Agreed build order:**
  1. Technical audit and specification.
  2. GitHub repo and core backend, tested with real OpenAPI examples.
  3. Payments and production deployment, with a real-money transaction and failure handling verified.
  4. Agent docs and distribution: skill.md, openapi.json, examples, then recruit real callers.
  5. Measure and decide.
- **Detailed phase exit conditions (from the earlier draft):**
  - Core: local tests pass on representative specs, no payments yet.
  - Security: malicious inputs are rejected and failures return predictable errors.
  - Payments: a real agent pays and gets a correct response.
  - Agent integration: an unfamiliar agent can discover, pay for and use the endpoint without help.
  - Distribution: track paying users, repeat calls, revenue, cost and support issues.
- **Extra item for the audit:** identify the existing free alternatives and explain why an agent would pay for Specshift instead of running them locally.
- **Biggest commercial weakness:** a deterministic OpenAPI diff is easy for an agent to reproduce locally. Treat V0 as a small paid-distribution experiment, not assumed recurring income. Repeat usage likely depends on CI or deployment workflows and agents that monitor many dependencies, so measure **repeat paying integrations**, not raw request counts.
- **Frontend:** none until the endpoint works, agents can call it, and paid usage has been recorded. The V0 public surface is the README, `/skill.md`, `/openapi.json`, a working API URL and one example.
- **Billing rule:** don't charge for requests already known to be invalid when the platform allows checking before payment. Document any settlement limitations that can't be avoided.

## Owner checklist (from input #2, 3 of 5 done)

- [x] Confirm the GitHub organization and authorize creating the Specshift repository. **Decided 2026-10-08: `danbuildss/specshift` (this repo).**
- [ ] Choose or approve a dedicated Base USDC receiving wallet address. *Owner will send it.*
- [x] Confirm whether Bankr x402 hosting is the preferred deployment platform. **Yes: Bankr is the host (D-010).**
- [x] Approve the $0.02 experimental price. **Approved (D-011).**
- [ ] Approve the technical specification before implementation.

## Open questions / things to confirm later

- ~~**Repository location.**~~ **Resolved 2026-10-08:** the canonical repo is **`danbuildss/specshift`**. This replaces `somehow-internet/specshift` from the brief and `somehow-internet/api-change-intelligence` from the earlier draft.
- ~~**Name and repo conflict between drafts.**~~ **Resolved 2026-10-08 by the owner:** "API Change Intelligence" was the original name, renamed to **Specshift** for brandability. The product definition is unchanged. The earlier draft's file layout (e.g. `public/skill.md`, `core/diff.ts`) is also superseded by the master brief's tree.
- **License.** The earlier draft says "MIT licensed for original code", but the master brief says MIT is a candidate only. Going with the master brief: decide after the dependency review.
- **Receiving wallet.** Use a dedicated wallet or an approved treasury wallet. Address not yet provided.
- **Hosting choice.** Pending the audit. Bankr x402 Cloud is the owner's leaning, if it's technically compatible. Other candidates are Vercel, Cloudflare Workers or a small container. Not the Luca/Cori VPS. Verify the host's actual SDK and payment interface; don't design around assumptions.
- **Name conflicts.** Owner reports an existing PyPI `specshift` package. Claude still needs to verify that, plus npm, domains, trademarks and GitHub.

## Log

- **2026-10-08:** Received the master brief. Saved it to notes.md. No code written. Waiting for more inputs.
- **2026-10-08:** Received input #2, the owner's cover document. Its master brief is identical to Appendix A, so I didn't save it twice. Recorded the new decisions, findings, owner checklist, build order and the earlier "API Change Intelligence" draft. Flagged the name, repo and license differences between drafts. No code written. Waiting for more inputs.
- **2026-10-08:** Owner confirmed the canonical repo is `danbuildss/specshift`. Checklist item 1 is done.
- **2026-10-08:** Owner approved **Breakra** (D-018) and D-013 to D-017 (D-020). They clarified that the repo lives on `danbuildss`, proposed `danbuildss/breakra`, with independent branding and no Somehow attribution (D-019). They approved T-001 *preparation* only.
  - **Docs:** renamed the living docs to Breakra; historical records kept.
  - **New files:** `T-001-PLAN.md`, the disposable probe in `experiments/t001-bankr-probe/` (bundled and run locally), and `.gitignore`.
  - **Findings (AUDIT §13):** registrar and trademark lookups are blocked from here; the repo may already be renamed; a price-0 Bankr service exists; no OpenAPI-diff competitor on Bankr; the payer PayBox wallet holds 0 USDC.
  - **Not done:** nothing deployed, spent, renamed or registered.
- **2026-10-08:** Phase 0 audit done and saved as `AUDIT.md`. Key results:
  - **Name conflict:** PyPI `specshift` is a same-category OpenAPI breaking-change tool.
  - **Bankr payments:** Bankr handles the whole payment layer, uploads one `index.ts` per service, and has no free routes.
  - **Engine bake-off:** api-smart-diff found 14/14, oasdiff 13/14 (but it's Go, so it can't ship on Bankr), and Atlassian openapi-diff about 7/14.
  - **Big-spec speed:** the 13 MB GitHub spec takes 9–14 s.
  - **Proposed decisions:** D-013 to D-017.
  - **Recommended next:** T-001, the Bankr probe.

  The benchmarks ran in the scratchpad and weren't committed. No production code written.
- **2026-10-08:** Owner decided three things. Bankr is the host (D-010). The $0.02 price is approved (D-011). Phase 0 is approved to start (D-012). Wallet addresses will follow.
- **2026-10-08:** Owner clarified three things. "API Change Intelligence" was renamed to Specshift for brandability, with the same product. Somehow Internet is the owner's company. The repo lives on the owner's personal account (`danbuildss`).
- **2026-10-08:** Received input #3, the project workspace zip. Installed the 9 docs in the repo root unchanged (commit `588f7d2`). Then made minimal reconciliation edits:
  - CLAUDE.md startup step 0 now says read `notes.md` first.
  - README navigation lists `notes.md`.
  - DECISIONS.md: added D-008 (repo is `danbuildss/specshift`), which supersedes D-002.
  - TASKS.md: the naming-check item notes the repo is settled.

  No production code written. Phase 0 not started; awaiting the owner's go-ahead.

---

## Appendix A — Specshift Master Product & Engineering Brief v1.0

*(Saved verbatim as received, 2026-10-08.)*

**Version:** 1.0
**Date:** October 8, 2026
**Status:** Approved concept; implementation not started
**Owner:** Somehow Internet
**Product:** Specshift
**Tagline:** Know what changed before your integration breaks.

### 1. Mission

Build Specshift, a small, independent, x402-paid API utility for autonomous coding agents and developers.

Specshift compares two versions of an API contract and produces a machine-readable report explaining:

- What changed.
- Which API operations, parameters, schemas or security requirements were affected.
- Which changes may be backward-incompatible.
- What evidence supports each finding.
- What the consuming agent should review next.

The initial product is one paid endpoint.

Specshift is not a general website scraper, autonomous agent, monitoring dashboard, API gateway, coding assistant, or SaaS platform.

The commercial hypothesis is that coding agents and integration-maintenance workflows will pay small amounts for convenient, reliable API contract analysis.

**This hypothesis is unproven. We must measure real external usage before expanding.**

### 2. Product principles

1. One narrow job, performed exceptionally well.
2. Backend first; no frontend during V0.
3. Agent-native design: JSON inputs, JSON outputs, OpenAPI documentation and skill instructions.
4. Pay per analysis through x402.
5. No login, subscription or account required for ordinary paid API use.
6. No LLM required in V0.
7. Prefer deterministic analysis with evidence over speculative AI explanations.
8. Reuse maintained libraries where practical.
9. No database or background scheduler until necessary.
10. No unnecessary infrastructure.
11. No fabricated confidence, findings, compatibility guarantees or payment claims.
12. Never treat untrusted remote API specifications as executable code.
13. Maintain a strict separation between core analysis and payment infrastructure.
14. Track costs, paid usage, errors and repeat buyers.
15. Do not add features merely because they are easy to build.

### 3. Target users

**Primary: autonomous coding agents.** Agents writing and maintaining software that integrates third-party APIs. Examples:

- A coding agent upgrading an SDK.
- An agent reviewing an API version migration.
- An agent checking whether a changed contract requires code updates.
- An agent evaluating compatibility between two OpenAPI documents.

**Secondary: developers and CI workflows.** Developers who want structured contract comparisons without setting up and maintaining a dedicated diffing environment.

**Not initially targeted:** Nontechnical consumers. Marketing teams. General website monitoring customers. Design-system extraction users. Enterprises requiring private deployment or complex compliance agreements.

### 4. Problem statement

API integrations can break when providers change contracts. Examples include:

- Removing an API operation.
- Removing or renaming a response field.
- Adding a new required request parameter.
- Changing accepted request types.
- Restricting accepted values.
- Changing authentication requirements.
- Changing response schemas.
- Removing a supported HTTP status or media type.

An agent may be able to compare documents itself, but doing so requires acquiring, parsing and interpreting the specifications. Specshift packages this work into a single paid API operation.

Important: The service must not claim that a contract change definitely breaks every consuming application. Compatibility depends on the consumer's actual usage and the API's runtime behavior.

### 5. V0 scope

**Required**

- Compare two OpenAPI contracts.
- Support OpenAPI 3.0.x initially.
- Accept JSON contract objects directly.
- Accept HTTPS URLs pointing to public OpenAPI JSON documents.
- Parse and validate both inputs.
- Normalize relevant structures.
- Detect meaningful contract changes.
- Classify compatibility risk using explicit rules.
- Return structured JSON with evidence.
- Provide deterministic results for equivalent inputs.
- Return explicit unsupported/unknown classifications where appropriate.
- Charge through x402 for successful analyses.
- Provide free health and discovery endpoints.
- Provide agent-friendly usage documentation.
- Collect minimal operational and revenue metrics.

**Optional after V0**

OpenAPI 3.1 support. YAML support. Stored snapshots. Single-URL comparison against previously observed versions. Multi-page documentation extraction. SDK-specific migration recommendations. MCP interface. AI-generated explanations. Scheduled monitoring. Webhooks.

**Explicit non-goals**

Frontend dashboard. User accounts. Email/password authentication. Token launch. Social platform. Arbitrary website crawling. Continuous monitoring. Autonomous code modification. Automated pull-request generation. Blockchain analytics. CORTX integration. Luca integration. MuseCourt integration.

### 6. Product identity

**Name:** Specshift
**Tagline:** Know what changed before your integration breaks.

Short description: "Specshift is a pay-per-use API that compares OpenAPI contracts and returns structured compatibility findings for coding agents."

Longer description: "Submit two versions of an OpenAPI specification. Specshift identifies changes to operations, parameters, schemas, responses and authentication requirements, classifies potential compatibility risks, and returns evidence that coding agents can use when updating integrations."

Tone: Technical. Precise. Minimal. Developer-native. No inflated reliability or AI claims.

Visual design is deferred until a frontend is justified.

### 7. Repository

Create a standalone public GitHub repository, subject to owner approval.

Proposed path: `somehow-internet/specshift`

Do not assume this repository already exists. If the GitHub organization or name is unavailable, report the issue rather than silently selecting a different owner.

Suggested repository structure:

```text
specshift/
├── src/
│   ├── app.ts
│   ├── index.ts
│   ├── config/
│   │   └── env.ts
│   ├── routes/
│   │   ├── analyze.ts
│   │   ├── health.ts
│   │   └── discovery.ts
│   ├── core/
│   │   ├── parse.ts
│   │   ├── validate.ts
│   │   ├── normalize.ts
│   │   ├── compare.ts
│   │   ├── classify.ts
│   │   └── format.ts
│   ├── security/
│   │   ├── fetch.ts
│   │   ├── url-policy.ts
│   │   └── limits.ts
│   ├── payments/
│   │   └── x402.ts
│   ├── telemetry/
│   │   └── metrics.ts
│   └── types/
│       └── api.ts
├── tests/
│   ├── fixtures/
│   ├── parse.test.ts
│   ├── compare.test.ts
│   ├── classify.test.ts
│   ├── security.test.ts
│   ├── payment.test.ts
│   └── integration.test.ts
├── examples/
│   ├── before.json
│   ├── after.json
│   └── expected-response.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── PAYMENTS.md
│   └── DEPLOYMENT.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── README.md
├── PLAN.md
├── DECISIONS.md
├── skill.md
├── openapi.json
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── LICENSE
```

Keep the structure proportional to the actual implementation. Do not create empty abstractions merely to match this tree.

Use the project's chosen license only after checking all dependencies and the owner's preference. MIT is a candidate for original code, not a mandatory assumption.

### 8. Technology stack

Preferred starting point: TypeScript. Node.js LTS. Hono or another lightweight framework. Zod or equivalent request validation. Mature OpenAPI parsing and comparison libraries. Vitest for tests. GitHub Actions for CI. Official x402 Foundation SDK where compatible. Base mainnet USDC for payments. Serverless or lightweight container hosting. Structured JSON logging.

Before choosing the diff engine, research:

1. Current maintenance status.
2. OpenAPI version coverage.
3. TypeScript/Node compatibility.
4. JSON output quality.
5. Compatibility classification behavior.
6. Performance.
7. Licensing.
8. Dependency and security risks.
9. Whether the engine executes external references or remote code.
10. How easy it is to isolate the engine from the HTTP layer.

Review OpenAPITools/openapi-diff as one reference implementation.

Do not build a custom comprehensive OpenAPI diff engine if a maintained alternative can be safely adapted.

### 9. Core API

**Paid operation:** `POST /v1/analyze`

**Input modes:** Exactly one input mode per request.

Mode A: inline specifications

```json
{
  "before": {
    "openapi": "3.0.3",
    "info": { "title": "Example API", "version": "1.0.0" },
    "paths": {}
  },
  "after": {
    "openapi": "3.0.3",
    "info": { "title": "Example API", "version": "1.1.0" },
    "paths": {}
  }
}
```

Mode B: public specification URLs

```json
{
  "before_url": "https://example.com/spec-v1.json",
  "after_url": "https://example.com/spec-v2.json"
}
```

Reject ambiguous requests mixing both modes. V0 URL fetching supports only public HTTPS resources. Do not support arbitrary authentication headers or private network destinations.

**Successful response**

```json
{
  "status": "success",
  "analysis_id": "sha256-derived-id",
  "engine_version": "0.1.0",
  "spec_versions": { "before": "3.0.3", "after": "3.0.3" },
  "summary": {
    "added": 1,
    "removed": 0,
    "modified": 1,
    "potentially_breaking": 1,
    "unknown": 0
  },
  "compatibility": "potentially_breaking",
  "changes": [
    {
      "id": "change-001",
      "kind": "required_parameter_added",
      "operation": { "method": "GET", "path": "/users" },
      "location": "query",
      "name": "region",
      "compatibility": "potentially_breaking",
      "reason": "A previously optional request now requires an additional query parameter.",
      "evidence": {
        "before": null,
        "after": { "name": "region", "required": true, "type": "string" }
      },
      "recommended_action": "Review callers of GET /users and provide the new required parameter."
    }
  ],
  "metadata": {
    "duration_ms": 42,
    "input_hashes": { "before": "sha256:...", "after": "sha256:..." }
  }
}
```

This is an illustrative contract, not a verified implementation. The final schema must be specified and validated before coding.

**Error response**

```json
{
  "status": "error",
  "error": {
    "code": "UNSUPPORTED_OPENAPI_VERSION",
    "message": "This version is not supported by the current analysis engine.",
    "retryable": false
  }
}
```

Error categories should include: INVALID_REQUEST, INVALID_SPECIFICATION, UNSUPPORTED_OPENAPI_VERSION, FETCH_BLOCKED, FETCH_TIMEOUT, FETCH_TOO_LARGE, UPSTREAM_ERROR, ANALYSIS_FAILED, RATE_LIMITED, PAYMENT_REQUIRED, PAYMENT_FAILED.

Do not expose internal stack traces, secret values or private network details.

### 10. Compatibility classification

Use a documented rule set. Suggested classifications: `compatible`, `potentially_breaking`, `breaking`, `unknown`.

Do not automatically classify every modification as breaking.

| Change | Initial classification |
|---|---|
| Add optional request parameter | Usually compatible |
| Add required request parameter | Potentially breaking |
| Remove existing endpoint | Breaking |
| Remove response field | Potentially breaking |
| Add optional response field | Usually compatible |
| Change authentication requirements | Potentially breaking |
| Narrow accepted enum values | Potentially breaking |
| Add new endpoint | Compatible |
| Change description only | Non-contract change |
| Unsupported schema construct | Unknown |

Rules must distinguish request-side and response-side compatibility. Do not silently ignore unsupported schema features. Include an explicit engine version and rule-set version so future results can be interpreted consistently.

### 11. Security model

Remote URL input is hostile. Mandatory controls:

- HTTPS-only fetching.
- Reject localhost.
- Reject private, loopback, link-local and reserved IPv4/IPv6 destinations.
- Reject cloud metadata endpoints.
- Resolve and validate DNS before connecting.
- Protect against DNS rebinding.
- Pin the validated destination during connection where supported.
- Reject or independently revalidate redirects.
- Restrict outbound ports.
- Set connection and total timeouts.
- Enforce maximum response bytes.
- Enforce maximum parsed document size.
- Limit JSON nesting and complexity.
- Limit concurrency.
- Avoid recursive unbounded reference resolution.
- Disable remote external references in V0 unless explicitly reviewed.
- Do not execute code from specifications.
- Do not fetch arbitrary URLs embedded inside submitted contracts.
- Sanitize error output.
- Apply abuse protection to free routes.
- Avoid logging raw customer specifications by default.

Do not ship URL mode if these protections cannot be implemented reliably. Inline-only mode is an acceptable first deployment.

### 12. Payment design

Use x402 v2 with Base mainnet USDC, subject to SDK and facilitator compatibility verification.

Initial target price: **$0.02 USDC per successful analysis.** This is a hypothesis, not a validated market price.

The payment flow must:

1. Accept a request.
2. Perform cheap structural validation before requiring payment where possible.
3. Return standard x402 payment requirements for an unpaid valid request.
4. Verify payment authorization through the selected integration.
5. Execute the analysis.
6. Settle according to the SDK's supported payment flow.
7. Return the result and standard payment metadata.
8. Avoid charging twice when a client safely retries the same paid request.

Important:

- Investigate whether the middleware verifies before execution and settles after successful execution.
- Do not assume this behavior is universal.
- Document failure cases where settlement may happen before the result is delivered.
- Use idempotency controls where supported.
- Test duplicate authorizations and concurrent retries.
- Never claim refunds are automatic.
- Never invent settlement status.
- Do not place the owner's wallet private key in the service.
- Use a receiving wallet address for payouts.
- Do not implement custom payment signing or settlement logic.

If the selected hosting platform cannot support this flow, present alternatives before changing architecture.

### 13. Free endpoints

- `GET /health`: Returns a basic liveness result.
- `GET /ready`: Returns whether the service can perform analyses, including required dependencies.
- `GET /skill.md`: Agent-readable instructions describing what Specshift does, when an agent should use it, when not to use it, supported input formats, price and payment mechanism, example request and response, how to interpret compatibility findings, and known limitations.
- `GET /openapi.json`: Machine-readable API contract.
- `GET /pricing`: Returns current supported network, asset and per-analysis price.

Do not expose secrets or internal configuration.

### 14. Observability

Track at minimum: total requests, valid analysis requests, invalid requests, payment-required responses, verified payment attempts, confirmed settlements, successful analyses, failed analyses, analysis latency, input size, engine errors, upstream fetch failures, gross settled USDC, estimated cost per analysis, unique paying wallets, and repeat paying wallets.

Wallet-based uniqueness is only an approximation of customer uniqueness.

Avoid storing full API contracts or sensitive request bodies in logs. Use existing host logs and simple aggregated metrics first. Do not introduce a full analytics platform or database unless necessary.

### 15. Testing requirements

**Parser tests:** Valid OpenAPI 3.0.x. Invalid JSON. Missing required fields. Unsupported versions. Oversized inputs. Deeply nested schemas. Invalid references.

**Comparison tests:** No changes. Added endpoint. Removed endpoint. Added required parameter. Added optional parameter. Removed response property. Authentication changes. Schema type changes. Enum changes. Description-only changes. Reordered JSON keys. Equivalent specifications with different formatting.

**Security tests:** Localhost URL. Private IPv4. Private IPv6. Link-local address. DNS rebinding scenario. Redirect to private address. Oversized remote response. Slow remote response. Recursive references. Malformed content type. Resource exhaustion attempts.

**Payment tests:** Unpaid request receives valid HTTP 402. Correct payment accepted. Invalid payment rejected. Wrong network rejected. Wrong asset rejected. Wrong recipient rejected. Duplicate authorization handled safely. Settlement failure handled explicitly. Analysis failure does not silently claim successful delivery. Real Base mainnet test with a controlled small budget.

**End-to-end tests:** A fresh coding agent should be able to:

1. Read `/skill.md`.
2. Understand the endpoint.
3. Submit a valid analysis request.
4. Receive the payment requirements.
5. Pay using a compatible x402 client.
6. Receive the analysis.
7. Correctly interpret the result.

### 16. Deployment

Preferred approach: use a low-maintenance hosting environment that supports the chosen runtime and x402 integration.

Candidate environments: Bankr x402 hosting (if technically compatible), Vercel, Cloudflare Workers (if runtime and dependencies permit), a small container service.

Do not deploy on the existing Luca or Cori VPS by default.

Before choosing a host, compare: runtime support, x402 SDK compatibility, execution limits, cold-start behavior, outbound network controls, pricing, logging, secrets management, rollback support, operational complexity.

Required environments: local development, test deployment, production.

Do not mix testnet and mainnet payment configuration. Use a dedicated receiving wallet or an explicitly approved existing treasury wallet.

### 17. CI/CD

On every pull request: install dependencies with a lockfile, type-check, lint, run unit tests, run security-focused tests, build the application, report failures.

Production deployment should happen only after passing checks. Provide a documented rollback process. Do not expose deployment tokens in GitHub logs.

### 18. Documentation

- **README.md** must include what Specshift is, why it exists, what it does and does not do, an example request and response, local development instructions, deployment instructions, payment information, limitations, security considerations, and the license.
- **PLAN.md** tracks the current phase, completed work, outstanding tasks, blockers, and the next approved action.
- **DECISIONS.md** records important architectural decisions, alternatives considered and rationale.
- **SECURITY.md** documents the threat model, URL restrictions, input limits, secrets handling and vulnerability reporting.
- **PAYMENTS.md** documents network, token, recipient configuration, payment flow, settlement semantics, failure behavior and pricing.
- **API.md** documents request and response schemas, errors and examples.
- **skill.md** provides concise instructions optimized for autonomous coding agents.

### 19. Commercial model

Initial price: $0.02 USDC per completed analysis.

Illustrative monthly gross revenue: 10 calls/day = $6. 100 calls/day = $60. 500 calls/day = $300. 1,000 calls/day = $600.

These figures exclude infrastructure, facilitator costs, retries, refunds, development time and other expenses. Do not treat projected calls as acquired demand.

The most important commercial metrics are:

1. External paid calls.
2. Distinct external paying wallets.
3. Repeat paid usage.
4. Revenue per paying wallet.
5. Gross margin per analysis.
6. Real developer feedback.
7. How often users choose Specshift over free alternatives.

### 20. Distribution

Do not launch with generic AI or Web3 marketing.

Build one clear demonstration: "An API contract changed. Here's what Specshift detected and what a coding agent should review."

Use real public OpenAPI specifications with permission to fetch and redistribute only what is allowed.

Distribution channels to evaluate: GitHub README and examples, x402 service directories, the Bankr agent ecosystem, coding-agent skill directories, developer communities, maintainers of integration-heavy open-source projects, and technical posts demonstrating real contract changes.

Avoid spam, fake usage, exaggerated findings or manufactured social proof. Do not assume directory listing creates paid demand.

### 21. Launch criteria

Do not call V0 launched until:

- Core comparison tests pass.
- Input validation is working.
- Security tests pass.
- Payment flow is verified.
- A real small-value transaction has settled.
- A paid analysis returns a correct result.
- Public agent instructions are available.
- Monitoring and error reporting work.
- A rollback procedure exists.
- The repository has clear setup instructions.

### 22. Validation period

Run a limited commercial experiment after launch. Suggested period: 14 days.

During that period: share real demonstrations, reach out to relevant developers, track independent paying wallets, track repeat usage, record why developers do or do not pay, and compare operating costs against revenue.

Do not add major features during the test.

After the experiment, classify the outcome:

- **Continue:** Real external buyers, repeat usage and credible unit economics.
- **Revise:** Some usage or feedback, but a specific obstacle prevents repeat purchases.
- **Stop:** No meaningful external demand despite targeted distribution, or economics are clearly unfavorable.

Do not use an arbitrary revenue target as proof of product-market fit.

### 23. Future opportunities — not approved for V0

Historical OpenAPI snapshot storage. Scheduled API contract checks. Semantic documentation comparisons. SDK upgrade risk reports. CI integrations. Agent memory of previously analyzed APIs. Paid monitoring bundles. MCP access. Webhooks for contract drift. Multi-provider contract intelligence.

Each future feature requires evidence of user demand.

### 24. Engineering workflow

Before every implementation phase:

1. Read README.md, PLAN.md and DECISIONS.md.
2. Inspect the actual codebase.
3. Identify the smallest required change.
4. Explain the plan.
5. Implement only the approved scope.
6. Run relevant tests.
7. Review security and payment implications.
8. Update documentation.
9. Report completed work, test results and remaining risks.
10. Wait for approval before advancing to the next major phase.

Never mark work completed without evidence. Never silently change the product's scope.

### 25. Immediate first assignment

Do not begin production implementation yet.

Perform a technical feasibility audit and produce:

1. Recommended OpenAPI comparison engine and alternatives.
2. Exact V0 support matrix.
3. Final request/response contract.
4. Compatibility classification rules.
5. URL fetching security design.
6. Recommended hosting environment.
7. Verified x402 SDK and facilitator integration approach.
8. Payment failure and retry behavior.
9. Dependencies and licensing review.
10. Realistic operating cost per request.
11. Testing strategy.
12. Repository setup plan.
13. Implementation milestones.
14. Main technical and commercial risks.

Check whether the name Specshift conflicts with existing projects, package names, domains or trademarks. Do not claim availability without verification.

Present findings and recommended decisions for approval.

**The goal is a working, reliable paid endpoint—not a large application.**

---

## Appendix B — Owner's cover document (input #2)

*(Received 2026-10-08. This saves only the parts that are new. The master brief embedded in this document is identical to Appendix A and is not repeated.)*

### B.1 Product decisions

> We're locking in Specshift as a small, agent-native, pay-per-use API utility. Its job is to compare API specifications, identify contract changes, and tell coding agents what they need to review. The intention is not to build another full SaaS product. It's to ship one reliable capability that other agents can pay to invoke through x402.

| Decision          | Direction                                                 |
| ----------------- | --------------------------------------------------------- |
| Name              | Specshift                                                 |
| Category          | API contract change intelligence                          |
| Primary customer  | Coding agents and developers maintaining API integrations |
| Business model    | Pay per analysis via x402                                 |
| Initial price     | $0.02 USDC, experimental                                  |
| Blockchain        | Base initially                                            |
| Backend           | TypeScript / Node.js                                      |
| Primary operation | `POST /v1/analyze`                                        |
| Frontend          | None in V0                                                |
| Database          | None in V0                                                |
| LLM               | None in V0                                                |
| Hosting           | Lightweight serverless or x402-compatible host            |
| GitHub            | Separate public repository                                |
| Parent            | Somehow Internet                                          |
| Launch strategy   | Backend → payments → agent documentation → distribution   |

Key promise: *"Give Specshift two API contracts. It returns what changed, which changes may break integrations, and the evidence behind each finding."*

Specshift V0 compares two supplied versions. It does not continuously monitor APIs or automatically discover old versions, because that would require storage, scheduling and a larger service.

### B.2 Findings before starting (owner-reported, not yet verified by Claude)

- **Name:** A Python package named `specshift` was published on PyPI in September 2026 and links to an existing GitHub repository. That doesn't automatically prevent us from using the name, but we shouldn't assume we own it exclusively. Check naming conflicts, trademarks, domains and GitHub availability before public branding. Use Specshift as the working name meanwhile.
- **Diff engine:** Don't write our own from scratch. OpenAPITools/openapi-diff already compares OpenAPI specs and reports compatibility changes (parameters, responses, operations). It's Java-based, so compare it against suitable TypeScript alternatives before selecting.
- **Payments:** The official x402 Foundation SDK has TypeScript packages, including a Hono integration, and the protocol supports accountless HTTP micropayments. Use the official implementation where practical.
- **Architecture recommendation:** Keep the comparison engine independent of payment infrastructure, so the actual utility can be tested thoroughly before x402 is connected.

### B.3 Owner setup checklist

Owner-level details Claude can't safely decide:

1. Confirm the GitHub organization and authorize creation of the Specshift repository.
2. Choose or approve a dedicated Base USDC receiving wallet address.
3. Confirm whether Bankr x402 hosting is the preferred deployment platform.
4. Approve the $0.02 experimental price.
5. Approve the technical specification before implementation.

### B.4 Order to follow

1. **Technical audit and specification (first).** Confirm the diff engine, x402 integration, hosting and security approach before committing to an architecture.
2. **GitHub and core backend.** Create the repository, implement contract comparison and test with real OpenAPI examples.
3. **Payments and production deployment.** Verify a complete real-money transaction, including failure handling.
4. **Agent documentation and distribution.** Publish the skill, API specification and examples, then recruit real callers.
5. **Measure and decide.** Determine whether anyone pays repeatedly before expanding the scope.

> Commercial warning: The most difficult part of Specshift is not writing the backend. It's convincing agents to pay for OpenAPI comparisons when free tools already exist. That's why we're keeping the implementation small and making the launch experiment measurable.

> Have Claude return the technical audit and proposed architecture before it writes production code.

> Backend first, frontend later. Don't build a frontend until the endpoint works, agents can call it, and we've recorded actual paid usage. Give it its own GitHub repository, but not its own company, token, or complicated product identity. We're building one small paid utility, not another Luca, CORTX, or MuseCourt.

### B.5 Earlier draft: "API Change Intelligence" (superseded naming, kept for context)

**Concept:** One API endpoint that tells coding agents what changed in API documentation and whether they need to update their integrations. Backend-first, TypeScript, x402 payments. `POST /v1/analyze`, $0.02 per successful analysis.

The agent submits a spec or documentation snapshot and gets back: what changed, which endpoints or parameters were affected, whether the change is potentially breaking, what evidence supports that, and what to review. This is not a general website scraper.

**Repo in this draft:** `somehow-internet/api-change-intelligence`, public, "MIT licensed for original code". It must not live inside the CORTX repository, because the two have different purposes, release cycles and security boundaries.

**Design choice:** V1 accepts two OpenAPI specs or structured snapshots rather than scraping arbitrary documentation pages, because comparing structured contracts is far more reliable than guessing meaning from HTML. URL fetching can be added once the core comparison is proven.

**Example response from the draft** (illustrative only; a removed parameter isn't automatically breaking in every context, and the classifier must apply explicit rules):

```json
{
  "status": "success",
  "summary": { "added": 2, "removed": 1, "modified": 3, "potentially_breaking": 2 },
  "changes": [
    {
      "type": "removed_parameter",
      "method": "POST",
      "path": "/v1/payments",
      "parameter": "wallet_address",
      "severity": "breaking",
      "evidence": { "before": "required", "after": "removed" }
    }
  ],
  "recommended_action": "review_integration"
}
```

**Stack table from the draft:**

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Simple, familiar agent tooling |
| Runtime | Node.js LTS | Good library ecosystem |
| Framework | Hono or lightweight HTTP handler | Minimal API overhead |
| Contract parsing | OpenAPI parser | Structured input validation |
| Comparison | OpenAPI-aware diff engine | Avoid reinventing compatibility rules |
| Payments | x402 via chosen host | Pay-per-call |
| Hosting | Bankr x402 Cloud, if supported | Avoid managing another VPS |
| Database | None initially | Stateless comparisons |
| Tests | Vitest | Unit and integration testing |
| CI | GitHub Actions | Automated checks |
| Monitoring | Structured logs + basic usage metrics | Cost and failure visibility |

First verify the exact deployment and payment interface the chosen host supports. Don't design around assumptions about its SDK.

**Draft file layout** (superseded by the Appendix A tree): `src/{index.ts, routes/{analyze,health}.ts, core/{parser,normalize,diff,classify,response}.ts, security/url-policy.ts, types/analysis.ts}`, `tests/{parser,diff,classify,security}.test.ts`, `examples/{before,after}.json`, `public/{skill.md,openapi.json}`, `README.md`, `PLAN.md`, `package.json`, `tsconfig.json`, `.env.example`, `.github/workflows/ci.yml`. Keep it deliberately small, with no multi-service architecture.

**Development phases and exit conditions:**

1. **Core backend.** A deterministic OpenAPI comparison covering added and removed endpoints, changed request and response schemas, auth changes and parameter changes. *Exit:* local tests pass against representative OpenAPI examples. No payments yet.
2. **Security and reliability.** URL validation, SSRF protection, timeouts, size limits, request validation, concurrency limits and clear errors. *Exit:* malicious inputs are rejected and ordinary failures return predictable errors.
3. **x402 payments.** Connect to the selected payment host. Confirm settlement, replay handling and how failed analyses are billed. *Exit:* a real agent can pay and receive a correct response.
4. **Agent integration.** Publish `/skill.md`, `/openapi.json`, docs and examples. Test an agent calling from a clean environment. *Exit:* an unfamiliar agent can discover, pay for and use the API without manual guidance.
5. **Distribution and measurement.** Publish real before/after examples, list in directories and approach developers who maintain integrations. *Exit:* track independent paying users, repeat calls, gross revenue, operating cost and support issues.

**How it earns:** Monthly profit = (paid calls × net revenue per call) − fixed operating costs. For example, 1,000 paid calls/day at $0.02 is $600 gross over 30 days, but reaching that traffic is the hard part. A two-spec comparison may only be called when an integration is updated, so repeat usage depends on agents monitoring many dependencies or running comparisons in CI and deployment. **Measure repeat paying integrations, not just request counts.**

**Frontend:** no dashboard, landing page, login, account system or visual diff UI in V0. The public experience is the GitHub README, `/skill.md`, `/openapi.json`, a working API URL and one example request and response. A frontend is worthwhile only if developers repeatedly ask to try it visually or a demo page materially improves adoption.

### B.6 Engineering instructions for Claude/Codex (from the earlier draft)

Objective: Given two OpenAPI specifications, return a deterministic, structured report describing contract changes and potential compatibility risks. Small, secure, reliable, easy for agents to invoke.

**Permanent rules:**

1. Backend first. No frontend until the paid endpoint is working and external usage justifies one.
2. One primary paid operation: `POST /v1/analyze`.
3. No database unless a demonstrated requirement emerges.
4. No LLM in V0. Use deterministic OpenAPI parsing and compatibility rules.
5. Reuse mature open-source libraries where licensing and technical fit permit.
6. Avoid implementing a general-purpose web crawler.
7. All remote URL fetching must enforce SSRF protection, DNS/IP validation, redirect checks, timeouts and response-size limits.
8. Every compatibility classification must be explainable and backed by before/after evidence.
9. Do not invent breaking changes or claim certainty where compatibility cannot be determined.
10. Invalid inputs and internal failures must produce explicit error responses.
11. Do not charge users for known-invalid requests where the payment platform allows preflight validation. Document unavoidable settlement limitations.
12. Keep payment logic separate from the core analysis engine.
13. Never commit private keys or secrets.
14. Preserve a clear distinction between free metadata endpoints and the paid analysis endpoint.
15. Track external paid usage and operating costs without unnecessarily retaining sensitive request content.

**Build sequence:**

1. Audit OpenAPI diff libraries and choose an engine.
2. Implement parsing, normalization, comparison, classification and JSON response generation.
3. Add tests, input security and failure handling.
4. Integrate the x402 host and test the real payment flow.
5. Publish agent discovery docs and a working example.
6. Run a limited distribution experiment and measure paid usage.

**First task:** Don't write production code. Prepare a concise technical specification covering the recommended diff library, licensing, input and output contracts, compatibility rules, hosting and payment integration, security model, tests, deployment and realistic cost per request. **Identify existing free alternatives and explain why an agent would pay for this endpoint instead of running them locally.** Wait for approval before implementation.

### B.7 Decisions stated now

| Question | Decision |
|---|---|
| Separate GitHub repository | Yes |
| Backend before frontend | Yes |
| Dedicated VPS | No |
| Database | Not for V0 |
| AI model | Not necessary initially |
| Initial paid operations | One |

> A deterministic OpenAPI diff is easy for coding agents to reproduce locally. That's the biggest commercial weakness. Treat V0 as a small paid-distribution experiment, not assumed recurring income. If buyers repeatedly use it, consider managed historical snapshots or higher-value semantic analysis, but only as responses to observed demand. The first action is to approve the backend specification, not build a website.

---

## Appendix C — Project workspace (input #3)

*(Received 2026-10-08. The files themselves now live in the repo root, so this records the context and owner instructions that came with them.)*

**Owner's intent:** The repo is a persistent project workspace for Claude, not just a code folder. Every new session should know what Specshift is, what was agreed, what shipped, what's blocked and what it may do next.

**Files and their roles:**

| File | Role |
|---|---|
| CLAUDE.md | Claude's permanent operating rules and session workflow |
| PRODUCT.md | What Specshift is, its users, boundaries and success criteria |
| PLAN.md | Development phases (0–5) and approval gates |
| ARCHITECTURE.md | Backend, API contract, security, payments and infrastructure |
| DECISIONS.md | Append-only decision log (D-001…), including pending approvals |
| TASKS.md | WIP limit of 1, backlog, acceptance criteria and definition of done |
| TESTING.md | Fixtures, security and payment tests, release gates and reporting format |
| LAUNCH.md | Pre-launch checklist, demo assets, 14-day experiment and daily metrics |
| README.md | Repo intro and navigation |

**Work cycle:** READ → AUDIT → PLAN → APPROVE → BUILD → TEST → REVIEW → DOCUMENT → STOP. Claude cannot advance to a new phase on its own. Every task ends with a report covering: changed files, commands and results, evidence, security and payment implications, what's unverified, blockers, and exactly one recommended next task.

**Notable details in the workspace docs (vs the master brief):**
- ARCHITECTURE.md adds a `rule_set_version` field to the response.
- PRODUCT.md and PLAN.md make URL mode explicitly optional: Phase 2 ships it only if SSRF defenses are proven, and inline-only is acceptable.
- PLAN.md phases: 0 Feasibility → 1 Core backend (no payments) → 2 Hardening → 3 x402 + deployment → 4 Agent distribution → 5 14-day experiment.
- DECISIONS.md is append-only. Supersede a decision with a new entry; never rewrite an old one.
- The master brief placed ARCHITECTURE/API/SECURITY/PAYMENTS docs in `docs/`. The workspace keeps the core docs in the root, and that layout wins (it's the owner's latest).

**Suggested first message (owner-drafted, to kick off Phase 0):**

> Read all the Markdown files … Your first task is Phase 0: technical feasibility and architecture audit. Research the best OpenAPI diff engine, evaluate our intended stack, confirm x402 integration and hosting options, review security and payment risks, and identify anything we need to change before coding. Return:
> 1. What you understand about Specshift.
> 2. Your technical recommendations and trade-offs.
> 3. What you agree or disagree with in our current architecture.
> 4. Any existing tools we should reuse instead of rebuilding.
> 5. Risks, limitations and estimated costs.
> 6. The exact next implementation task.
>
> Do not write production code, create infrastructure or deploy anything yet. … Work carefully, verify your claims, and keep the Markdown documents updated as we progress.

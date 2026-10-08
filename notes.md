# Specshift — Working Notes

> **WORKFLOW RULE (always):** Before building, integrating or changing anything, read this file first to know where we are. Every decision, input and step we take gets recorded here.

---

## Current status

- **Phase:** Collecting inputs. **No implementation has started.**
- **What's happening now:** The owner is sending the context documents. Claude records them here and builds nothing.
- **Next step:** Once the owner has sent everything, create the project docs (README.md, PLAN.md, DECISIONS.md, etc.) from these notes. Then do the feasibility audit described in Brief §25.
- **Waiting on:** Any more documents or context from the owner.

## Inputs received

| # | Date | What | Where |
|---|------|------|-------|
| 1 | 2026-10-08 | Specshift Master Product & Engineering Brief v1.0 | [Appendix A](#appendix-a--specshift-master-product--engineering-brief-v10) |

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

## Open questions / things to confirm later

- **Repository location.** The brief proposes `somehow-internet/specshift`, but the actual working repo is `danbuildss/specshift`. Confirm which one is canonical.
- **License.** MIT is a candidate only. Decide after the dependency review and the owner's preference.
- **Receiving wallet.** Use a dedicated wallet or an approved treasury wallet. Address not yet provided.
- **Hosting choice.** Pending the audit. Candidates are Bankr x402, Vercel, Cloudflare Workers or a small container. Not the Luca/Cori VPS.
- **Name conflicts.** Specshift name, package, domain and trademark checks have not been done yet.

## Log

- **2026-10-08:** Received the master brief. Saved it to notes.md. No code written. Waiting for more inputs.

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

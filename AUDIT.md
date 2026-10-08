# Specshift — Phase 0 Feasibility Audit

**Date:** 2026-10-08 · **Task:** T-000 (approved, D-012) · **Status:** Delivered for owner review. Nothing here is approved until the owner says so.
**Method:** Package and source inspection, hands-on benchmarks in a scratch environment (not committed), and web research. Every claim is tagged **[verified]** (I ran or read it myself), **[reported]** (a secondary source), or **[unknown]** (must be tested).

---

## 1. What I understand Specshift to be

- **What it is:** One paid endpoint. An agent posts two OpenAPI 3.0 contracts (old and new). Specshift returns deterministic JSON: what changed, which side it affects (request or response), a compatibility class (`compatible` / `potentially_breaking` / `breaking` / `unknown`), before/after evidence, and a review hint.
- **Price and hosting:** $0.02 USDC on Base, collected by Bankr x402 Cloud.
- **What V0 doesn't have:** a frontend, a database, an LLM, or monitoring.
- **What it's for:** It's a commercial experiment. Success means independent wallets paying more than once.

## 2. Headline findings

| # | Finding | Impact |
|---|---|---|
| F1 | **Name conflict, same category.** PyPI `specshift` v1.0.0–1.4.0 (Aug 31 – Sep 8, 2026, `github.com/Lethe044/specshift`) is *"Detects, classifies, and optionally summarizes breaking changes … in OpenAPI/Swagger, GraphQL, and Protobuf/gRPC contracts"*. It also ships a GitHub Action. **[verified via PyPI API]** That's the same product category and the same name. Other uses: a `fritze-dev/SpecShift` agent workflow tool, and old astronomy tasks (IRAF/MIRIAD). `specshift.com` resolves to a live host. `.dev`, `.io`, `.ai` and `getspecshift.com` have no DNS (that suggests they're unregistered but doesn't prove it). npm `specshift` is unclaimed. A trademark search found nothing, but that isn't legal clearance. | **Owner decision needed** before any public branding. Building can continue under the working name. |
| F2 | **Bankr runs the whole payment layer.** We write a plain `handler(req: Request): Promise<Response>`. Bankr wraps x402, verification and on-chain settlement. **[verified in `@bankr/cli` 0.3.45 source]** That fully satisfies "no custom payment logic" and "no private keys in the service". | Simplifies Phase 3 a lot. We don't need `@x402/hono` or a facilitator of our own. |
| F3 | **Bankr uploads only one file per service.** `bankr x402 deploy` sends the raw text of `x402/<service>/index.ts`, plus `dependencies` from an optional `package.json`. Bundling happens server-side with Bun ("builder Lambda"). **[verified in CLI source]** Other local files aren't uploaded. | Our code can stay modular in `src/`, but a build step must generate one self-contained `x402/analyze/index.ts`. |
| F4 | **Every Bankr service is paid.** There's no free route type, and the CLI's lowest default price is $0.001. **[verified]** | The brief's free `/health`, `/skill.md`, `/openapi.json` and `/pricing` can't be free on Bankr. That needs an ADR (§4). |
| F5 | **Bankr settles only if the handler "returns successfully".** **[reported: Bankr docs snippet; docs.bankr.bot is blocked from this environment]** If that means "non-2xx is never charged", invalid requests that get a 4xx response cost the caller nothing. | Very good for the "don't charge for invalid input" rule. **Must be verified with real payments** (probe, §7). |
| F6 | **Bankr limits are unknown.** Handler timeout, memory, request body size, outbound network and retry/idempotency behaviour aren't documented anywhere I could reach. **[unknown]** One open GitHub issue reports blank HTTP 500s on paid calls, with nothing charged **[reported]**. | These are the main technical risks. A small probe deploy settles them. |
| F7 | **Fees:** reportedly free up to 1,000 requests/month, then 5%. **[reported: press and secondary sources]** Bankr pays the compute; we pay no hosting or gas. | Cost per call is about $0.000–$0.001. Margin is about 95%+. Verify in the dashboard. |

## 3. Diff engine: recommendation and evidence

I tested four candidates on a fixture with **14 deliberate contract changes**: endpoint removed or added, required or optional query parameter added, response property removed or added, response status removed, response media type removed, request enum narrowed, request type changed, request property made required, response enum widened, security added, and a description-only edit. I also tested **GitHub's real 13 MB OpenAPI spec** (v22 → v24 and v23 → v24).

| Engine | Lang / license | Detected (of 14) | Evidence quality | Ships in a Bankr TS handler? | Notes |
|---|---|---|---|---|---|
| **api-smart-diff 1.0.6** | TS/JS · MIT · 2 deps | **14/14** [verified] | Exact JSON path per change, before/after values | **Yes.** Pure JS, ran under Node 22 and **Bun** [verified] | No network code in it or its deps [verified]. Handles circular `$ref`s and ignores remote `$ref`s without fetching them [verified]. **Last release Jul 2024** (maintenance risk). Built-in labels have bugs: it called an optional param "required", called a response "Request Body", and classed "security added" as non-breaking. It logs internal rule errors on big specs. 13 MB spec: 13 s, ~240 MB RSS. |
| **oasdiff** (Go) | Go · Apache-2.0 | 13/14 (the description edit is correctly not a change) [verified] | Very good, with 100+ named check IDs | **No.** It's a Go binary, and Bankr runs TypeScript only. The npm name `oasdiff` is a "reserved placeholder", not the tool [verified]. | Best-in-class and actively maintained. 13 MB spec: 8.9 s. It classes "security added" and "response property removed" as *info*, so we'd still want our own rules. |
| **openapi-diff 0.24.1** (Atlassian, npm) | TS · Apache-2.0 · 9 deps | **~7/14** [verified] | Coarse: "schema scope added/removed" without naming the field | Technically yes | **Missed** the required and optional params, security, and media type. Pulls in `swagger-parser` and `axios`, which can fetch remote refs (SSRF surface). **Reject.** |
| pb33f openapi-changes (npm) | Go binary via postinstall download | not tested | — | No | Downloads a binary at install time. Reject. |
| OpenAPITools/openapi-diff | Java | not tested | — | No | Java runtime. Reference only. |

**Recommendation (to approve as D-013):**
1. **Diff layer:** `api-smart-diff`, pinned to an exact version and wrapped behind our own `compare()` interface so it can be swapped or vendored (it's MIT, so we can fork it if it rots).
2. **Classification:** a **Specshift-owned rules layer** (`rule_set_version`). It maps each raw diff to our four classes and writes our own `reason` and `recommended_action` text. We **don't trust the library's labels or classifications** (bugs shown above).
3. **Correctness oracle:** oasdiff runs in **CI only** (it isn't shipped). It cross-checks our findings against every fixture and a few real-world spec pairs, which catches regressions and blind spots cheaply.

## 4. Architecture: what I agree with and what I'd change

**Agree:** TypeScript, deterministic and stateless, no DB or LLM, one paid operation, the error code list, `engine_version` plus `rule_set_version`, request vs response direction, and "unknown, never silently ignored". Vitest and GitHub Actions too.

**Changes I propose (each needs your OK):**

| ADR | Proposal | Why |
|---|---|---|
| D-013 | Engine = api-smart-diff + our own rules layer, with oasdiff as the CI oracle | §3 evidence |
| D-014 | **Inline-only V0. URL mode deferred.** | On Bankr we don't control DNS resolution, IP pinning or egress, and we don't know whether outbound fetch is even allowed (F6). The brief explicitly allows inline-only. This removes the largest security surface. |
| D-015 | **No Hono or HTTP framework in production.** A single `handler(Request)` and a build step that bundles `src/` into `x402/analyze/index.ts`. | Bankr gives us the HTTP layer (F2, F3). Hono adds nothing there. It's optional for local dev only. |
| D-016 | **Free discovery moves off Bankr.** `skill.md`, `openapi.json` and pricing get served from the GitHub repo (raw / GitHub Pages). We use Bankr's built-in `schema` and discovery listing (`bankr.x402.json` input/output JSON Schema, `bankr x402 search`). There's no `/health` or `/ready` endpoint; liveness comes from Bankr's dashboard. | Every Bankr route is paid (F4). This changes brief §13, so it needs your approval. |
| D-017 | **No `@x402/hono` and no facilitator code.** Bankr owns the payment layer. | F2. Our "payments" code shrinks to config plus tests. |

## 5. Proposed V0 support matrix

| Item | V0 |
|---|---|
| OpenAPI 3.0.0 – 3.0.4 | Supported |
| Swagger 2.0, OpenAPI 3.1, 3.2 | Rejected with `UNSUPPORTED_OPENAPI_VERSION` (3.1 is a candidate after V0) |
| JSON | Supported. YAML: no |
| Input | Inline `before` and `after` objects only (D-014) |
| Local `$ref` (`#/...`), including circular | Supported |
| Remote or file `$ref` | Never fetched. Reported as an `unknown` finding |
| Size limits | **To be set from the probe.** Starting proposal: ≤ 2 MB per spec, ≤ 4 MB body, depth ≤ 64. The 13 MB GitHub spec takes 9–14 s, so big specs are the main timeout risk. |
| Determinism | Canonicalized input with sorted keys, stable change ordering, and `sha256` input hashes |

## 6. Proposed request/response contract (draft, to finalize in Phase 1)

**Request:** `POST` with JSON body `{ "before": <OpenAPI 3.0 object>, "after": <OpenAPI 3.0 object> }`. Extra top-level keys get `INVALID_REQUEST`.

**Response (200):** keep the brief's shape, plus:
- `rule_set_version` alongside `engine_version`.
- `direction` on each change: `request`, `response`, `operation` or `security`.
- `evidence.pointer`: a JSON pointer into `before` and/or `after`, so an agent can locate it.
- `analysis_id` = `sha256(engine_version + rule_set_version + hash(before) + hash(after))`. The same input always gives the same ID and result.
- `limitations`: a list of unsupported constructs we saw (these are also emitted as `unknown` changes).

**Errors:** the brief's codes, minus `FETCH_*` (no URL mode in V0), and all as 4xx. A 4xx should mean no settlement, which the probe must verify. `PAYMENT_*` responses come from Bankr, not from us.

## 7. Compatibility rules (rule set 0.1.0, draft)

| Change | Class | Direction |
|---|---|---|
| Operation or path removed | breaking | operation |
| Operation added | compatible | operation |
| Required param added, or optional param became required | potentially_breaking | request |
| Optional param added | compatible | request |
| Param removed | potentially_breaking | request |
| Request property became required, or type changed, or enum value removed, or constraint narrowed (max/min/pattern) | potentially_breaking | request |
| Request enum widened, or constraint relaxed | compatible | request |
| Request media type removed | potentially_breaking | request |
| Response property removed, or type changed | potentially_breaking | response |
| Response optional property added | compatible | response |
| Response enum value added | potentially_breaking (clients may not handle it) | response |
| Success status or media type removed | potentially_breaking | response |
| Error status removed | compatible | response |
| Security requirement added or changed on an operation | potentially_breaking | security |
| Security removed | compatible | security |
| Description, summary, example or `info.version` changed | `non_contract` (counted, not risky) | — |
| Remote `$ref`, unsupported keyword or unparseable construct | unknown | — |

Overall `compatibility` is the worst class across all changes. **Wording rule:** never "will break"; always "may break consumers that rely on …".

## 8. Free alternatives, and why an agent would pay anyway

**Free substitutes:**
- oasdiff (CLI, GitHub Action)
- Atlassian openapi-diff
- OpenAPITools openapi-diff
- pb33f openapi-changes
- **Lethe044/specshift** (Python, with optional AI summaries)
- An agent can also just write a diff script itself.

**Honest pitch:** Specshift needs no install. Agents in sandboxes often can't install Go or Java binaries. You get one HTTP call, a stable agent-oriented JSON schema with evidence pointers and actions, consistent classification across languages, and x402 with no account or API key.

**Moat:** weak. As the brief already says, V0 is a distribution experiment.

## 9. Risks, limitations, cost

**Technical:**
- Bankr's limits are unknown (timeout, body size, memory), and big specs could time out. Mitigations: limits plus a probe.
- Bankr platform bugs (blank 500 issue). Mitigation: probe, then keep a fallback plan.
- api-smart-diff is unmaintained. Mitigations: pin it, wrap it, oasdiff oracle, fork if needed.
- Single-file bundle constraint. Mitigation: build step, verified by the probe.

**Payment:**
- Settlement-on-success semantics are unverified.
- Retry and duplicate-charge behaviour is unknown.
- We don't control refunds. Never promise them.

**Commercial:**
- A direct same-name competitor exists (F1).
- Free tools are a perfect substitute for technical users.
- Demand is likely low-frequency (per upgrade, not per hour).

**Cost per call:** compute $0 (Bankr). Platform fee is $0 for the first 1,000 requests/month, then about $0.001 (5%, reported). Gas is $0 to us. Net is about **$0.019 per paid call**. Fixed costs are about $0 (public repo CI is free). The real cost is development time.

## 10. Sources

- PyPI JSON API for `specshift`; npm registry for every package version and license above (queried 2026-10-08).
- `@bankr/cli` 0.3.45 `dist/commands/x402.js` (inspected locally).
- Bankr docs: [x402 Cloud overview](https://docs.bankr.bot/x402-cloud/overview/), [Quick Start](https://docs.bankr.bot/x402-cloud/quick-start/). Seen via search snippets only; the site is blocked here.
- [Bankr launch press release](https://chainwire.org/2026/04/02/bankr-launches-x402-cloud-on-4-02-day-as-x402-protocol-joins-the-linux-foundation/), [third-party review](https://agentpaytrend.com/bankr-x402-cloud-5-realities-deploy/) (fee and free tier, reported).
- [BankrBot/x402-cli-example issue #5](https://github.com/BankrBot/x402-cli-example/issues/5) (blank 500 report).
- [oasdiff](https://github.com/oasdiff/oasdiff), [Lethe044/specshift](https://github.com/Lethe044/specshift), [x402 Bazaar docs](https://docs.x402.org/extensions/bazaar).

## 11. Exact next task (recommended, needs approval)

**T-001: Bankr platform probe.** Deploy one throwaway service on your Bankr account at $0.001. No product code. It answers F3–F7 with real evidence:
- Does a bundled single-file handler work?
- Max request body size and handler timeout (by sending growing payloads and sleeping).
- Whether a 4xx or 5xx response is charged.
- Behaviour on a duplicate or retried payment.
- Whether outbound fetch is allowed.
- What the payout address and fee look like.

**Total spend:** under $0.05. **What you'd need to provide:** run `bankr login` yourself (or give me the go-ahead and a way to authenticate) and a wallet with about $0.10 USDC on Base to pay from. Then we delete the probe.

Phase 1 (core engine) doesn't depend on Bankr and could run in parallel, but the probe sets the size limits and bundle approach that Phase 1 must respect.

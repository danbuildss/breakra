# Breakra — Phase 0 Feasibility Audit

*(Written while the product's working name was Specshift. Historical mentions of "Specshift" below are kept as-is. Forward-looking references now say Breakra.)*

**Date:** 2026-10-08 · **Task:** T-000 (approved, D-012) · **Status:** Delivered for owner review. Nothing here is approved until the owner says so.

> **Update 2026-10-08:** The owner rejected "Specshift" as the public brand (F1). See §12 for the naming clearance audit. **The owner approved Breakra (D-018)** and approved D-013 to D-017 (D-020). See §13 for post-approval findings and §14 for the T-001 plan. The repo has not been renamed by Claude.

**Method:** Package and source inspection, hands-on benchmarks in a scratch environment (not committed), and web research. Every claim is tagged **[verified]** (I ran or read it myself), **[reported]** (a secondary source), or **[unknown]** (must be tested).

---

## 1. What I understand Breakra (then "Specshift") to be

- **What it is:** One paid endpoint. An agent posts two OpenAPI 3.0 contracts (old and new). Breakra returns deterministic JSON: what changed, which side it affects (request or response), a compatibility class (`compatible` / `potentially_breaking` / `breaking` / `unknown`), before/after evidence, and a review hint.
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
2. **Classification:** a **Breakra-owned rules layer** (`rule_set_version`). It maps each raw diff to our four classes and writes our own `reason` and `recommended_action` text. We **don't trust the library's labels or classifications** (bugs shown above).
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

**Honest pitch:** Breakra needs no install. Agents in sandboxes often can't install Go or Java binaries. You get one HTTP call, a stable agent-oriented JSON schema with evidence pointers and actions, consistent classification across languages, and x402 with no account or API key.

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

---

## 12. Naming clearance audit (2026-10-08, requested after the owner rejected "Specshift" as the public brand)

**Status:** Findings only. No accounts created, no domains bought, and no project files changed except this one. Awaiting the owner's choice.

### Method and how far it goes

| Check | How | What it can and can't prove |
|---|---|---|
| npm, PyPI, crates.io | Registry APIs queried directly | **Verified** taken or free *at check time* |
| GitHub user/org handle | `github.com/<name>` fetch | **Verified** exists (200) or doesn't (404) at check time |
| Domains .com/.dev/.xyz (plus .io/.ai) | Live DNS NS/SOA lookups via 8.8.8.8 | **Delegated NS = verified registered.** **NXDOMAIN = probably unregistered, NOT proven** (a domain can be registered without nameservers). RDAP/WHOIS are blocked from this environment, so **confirm at a registrar before relying on any domain.** |
| Trademarks | Web search of USPTO aggregators (Justia, Trademarkia, uspto.report) | **Not a clearance.** The official USPTO, EUIPO and WIPO search UIs weren't reachable from here. "No hit" means *no evidence found*, not *clear*. |
| Products, companies, discoverability | Web search | Good at finding conflicts, can't prove absence |

### The three names you proposed

**Revra**
- **Verified conflicts:**
  - **REVRA trademark application**: serial 99638400, Revra LLC (El Cajon, CA), filed Feb 6 2026, **Class 14 (jewelry rings)**, live/pending ([Trademarkia](https://www.trademarkia.com/revra-99638400)). That's a different class from software (9/42), so direct legal risk is low, but the mark isn't free.
  - **revra.com** is registered and resolving (eftydns NS). **revra.dev** is registered (Cloudflare NS). revra.io and revra.ai are registered.
  - The GitHub handle `revra` is taken (individual user, no public repos).
- **Free (verified):** npm `revra`, PyPI `revra`, crates `revra`.
- **Uncertain:** revra.xyz returned NXDOMAIN (probably unregistered).
- **Software/product use:** none found. Near-misses are Rev, Reva, Revenera and REVIRA (a student VR project). Moderate search noise from "Rev"/"Reva".
- **Verdict:** clean in software. Weak on domains: both .com and .dev are held by others.

**Deltic: reject**
- **Verified conflicts:**
  - **npm `deltic` is taken by an active developer tool.** v0.2.0, "Gulp-based incremental compile toolkit", updated **2026-10-06**.
  - **npm `@deltic/*` scope** and GitHub org **`deltic-oss/deltic`**: TypeScript building blocks for applications ([PR #23](https://github.com/deltic-oss/deltic/pull/23)). That's the same ecosystem we'd ship in.
  - **Deltic (France)**, an invoice/document software company ([PitchBook](https://pitchbook.com/profiles/company/465491-35), [Software Advice](https://www.softwareadvice.com/document-control/deltic-profile/)).
  - UK companies Deltic Solutions Ltd and Deltic Systems Ltd ([Companies House](https://find-and-update.company-information.service.gov.uk/company/10376858)).
  - deltic.com, deltic.dev and deltic.ai are all registered.
- **Uncertain:** deltic.xyz and deltic.io returned NXDOMAIN.
- **Verdict:** existing TypeScript developer tooling and a software company use this name. **High confusion risk.**

**Drifto: reject**
- **Verified conflicts:**
  - **PyPI `drifto`**: "Automatic featurization and ML for event analytics".
  - **Drifto desktop app** with API/webhooks ([driftoapp.com](https://driftoapp.com/)).
  - A Drifto mobile game ([JohnnyHowe/drifto-pages](https://github.com/JohnnyHowe/drifto-pages/issues)).
  - drifto.com, drifto.xyz, drifto.io and drifto.ai are all registered.
- **Uncertain:** drifto.dev returned NXDOMAIN. npm `drifto` is free (verified).
- **Discoverability:** very poor. "Drift" (Salesloft), Drift Protocol, and "API/data drift" as a general concept all dominate results.
- **Verdict:** several existing software products. **High confusion and poor searchability.**

### Additional candidates

I pre-screened 12 coined names (Pactra, Diffra, Specra, Contrava, Pactly, Breakra, Delvra, Diffact, Pactdiff, Kontrakt, Shiftora, Vardiff) on registries and DNS.
- **Excluded "Pact-" names:** Pact/PactFlow is a well-known **API contract-testing** product, so those would be confusing in our exact space.
- **Excluded Specra:** npm `specra` and `specra-cli` exist.
- **Excluded Pactra:** `@pactra.dev/*` exists.

Three survivors:

**Breakra**
- **Free (verified):** npm `breakra`, PyPI `breakra`, crates `breakra`, GitHub handle `breakra` (404).
- **Conflicts found:** none. Web search returned only "Breaka", a London DJ, which is a different field and spelling. No trademark records found.
- **Domains:** **.com, .dev, .xyz, .io and .ai all returned NXDOMAIN.** That's probably all unregistered, but unproven.
- **Notes:** The "break" root ties directly to *breaking changes* and is memorable. Pronunciation is slightly ambiguous ("BRAKE-ra").

**Delvra**
- **Free (verified):** npm, PyPI, crates.
- **Domains:** **.com, .dev, .xyz, .io and .ai all returned NXDOMAIN** (probably unregistered, unproven).
- **Verified conflicts:**
  - GitHub handle `delvra` is taken (inactive user).
  - delvra.nl, a Dutch household-goods shop.
  - delvra.website, a software-license reseller.
- **Trademark:** none found.
- **Notes:** The meaning is abstract ("delve" / "delta"). It sounds close to "Delve", an existing startup name.

**Contrava**
- **Free (verified):** npm, PyPI, crates.
- **Domains:** **contrava.com is registered.** .dev, .xyz, .io and .ai returned NXDOMAIN.
- **Verified conflicts:**
  - CONTRAVA trademark, Orexigen Therapeutics, pharma, **abandoned 2015** ([Justia](https://trademarks.justia.com/862/74/contrava-86274951.html)).
  - **Contrave**, a well-known weight-loss drug. Search engines "correct" to it.
  - Contrava Service Ltd (UK, dissolved 2021).
- **Notes:** The meaning ("contract") fits, but discoverability is poor.

### Ranking

| Rank | Name | Why |
|---|---|---|
| **1** | **Breakra** | The only candidate where no conflicts turned up in any check: registries free, GitHub handle free, every TLD shows NXDOMAIN, no trademark hits, no software products. Its meaning maps to the product (breaking changes). |
| 2 | Revra | The best-sounding name, and no software conflicts. But **.com and .dev are both held**, the GitHub handle is taken, and there's a pending REVRA trademark (jewelry class). It works only if `revra.xyz` (or a prefix like `getrevra.dev`) is acceptable. |
| 3 | Delvra | Domains look open, but the meaning is weak, there are minor existing uses (a shop and a software reseller), and the GitHub handle is taken. |
| — | Contrava | Pharma-brand confusion (Contrave). .com is taken. |
| ✗ | Deltic, Drifto | Verified conflicts with existing software and developer tools. |

**Recommendation: Breakra.** Before committing, the owner (not Claude) should:
1. Check breakra.com, breakra.dev and breakra.xyz at a registrar. NXDOMAIN isn't proof of availability.
2. Run an official USPTO search (Classes 9 and 42) and a WIPO Global Brand Database search, or ask counsel. Neither was reachable from here.
3. Optionally reserve the npm name, GitHub org and domains in one sitting once approved, to avoid squatting between check and purchase.

**Sources:**
- npm registry, PyPI JSON API, crates.io sparse index, Google public DNS and GitHub profile fetches (all queried 2026-10-08).
- [Trademarkia REVRA](https://www.trademarkia.com/revra-99638400)
- [Justia CONTRAVA](https://trademarks.justia.com/862/74/contrava-86274951.html)
- [deltic-oss/deltic](https://github.com/deltic-oss/deltic/pull/23)
- [Deltic PitchBook](https://pitchbook.com/profiles/company/465491-35)
- [Deltic Software Advice](https://www.softwareadvice.com/document-control/deltic-profile/)
- [Deltic Solutions Ltd](https://find-and-update.company-information.service.gov.uk/company/10376858)
- [Drifto app](https://driftoapp.com/)
- [drifto-pages](https://github.com/JohnnyHowe/drifto-pages/issues)
- [Contrava Service Ltd](https://find-and-update.company-information.service.gov.uk/company/12124254)
- [Breaka (DJ)](https://ra.co/dj/breaka)
- [delvra.nl](https://delvra.nl/), [delvra.website](https://delvra.website/)

---

## 13. Post-approval findings (2026-10-08, after Breakra and D-020 were approved)

| # | Finding | Evidence class |
|---|---|---|
| P1 | **Authoritative domain lookup not possible from Claude's environment.** RDAP and WHOIS for Verisign (.com), Google Registry (.dev), CentralNic (.xyz), rdap.org, whois.com and who.is are all blocked by the egress proxy. breakra.com and breakra.dev remain **NXDOMAIN (no delegation)** in DNS, which is consistent with unregistered but **unproven**. → **The owner must check at a registrar** before public branding. | Unknown / blocked |
| P2 | **No official trademark search possible from here** (USPTO, EUIPO and WIPO UIs unreachable). Web aggregators show no BREAKRA record. → Unresolved. Owner or counsel to search Classes 9 and 42. | Unknown / blocked |
| P3 | **The repo has already been renamed to `danbuildss/breakra` (VERIFIED).** The `git push` of commit `d00fcde` returned `remote: This repository moved. Please use the new location: https://github.com/danbuildss/breakra.git`. Earlier signal: `git ls-remote https://github.com/danbuildss/breakra` returns the same HEAD SHA (`141011b…`) as `danbuildss/specshift`. A made-up repo name fails. That is consistent with a GitHub rename plus redirect, but not proven: the GitHub API for `breakra` is outside this session's scope. Claude renamed nothing; the rename was done outside this session. The local remote still points at the old URL, and GitHub redirects it. | **Verified** (GitHub push response) |
| P4 | **F4 needs revising.** Bankr's public discovery API lists a service at **price `0`** (`littlefinger-demo`), so free routes may exist on Bankr. T-001 case T11 will test it. If confirmed, D-016 (moving free discovery off Bankr) should be revisited. | Verified listing; behaviour unverified |
| P5 | **No OpenAPI-diff service found on the Bankr marketplace.** Searches for "openapi", "api diff", "breaking changes" and "swagger" returned only unrelated services. The closest is `webpage-diff` ($0.04, HTML text diff). Low direct competition inside Bankr. | Verified (discovery API, 2026-10-08) |
| P6 | **Network reachability from Claude's environment:** `api.bankr.bot` (deploy, discovery, revenue) is reachable. `x402.bankr.bot` (the paid endpoints) is blocked. → T-001 paid calls go through PayBox. | Verified |
| P7 | **Payer wallet:** PayBox `eth1` `0x96753D18312Bd3736ffe86666E7dcc7Bc34ce51C` has 0 USDC on Base (2026-10-08 07:16 UTC). It needs funding before T-001. | Verified |

## 14. T-001 plan

See **`T-001-PLAN.md`**: accounts, wallets, endpoint names, price, call count, max spend, test cases, irreversible actions and uncertainties. **Not executed.** Waiting for owner confirmation.

## 15. Cross-check of the Bankr-provided technical brief (input #4, 2026-10-08)

The owner forwarded a brief written by Bankr's agent (archived verbatim in `notes.md`, Appendix D). It adds useful facts, but several claims conflict with evidence verified earlier. **T-001 decides every row marked ⚠️.**

| Topic | Bankr brief says | Our evidence | Status |
|---|---|---|---|
| **Charging on handler errors** | Payment settles **before** the handler runs. 400, 500, a throw or a timeout are **all charged, no refund**. (The brief's own §6 also says "Failed executions billed: no", which contradicts its §3.) | Bankr docs snippets: *"payments are only collected if your endpoint returns successfully"* and *settles "only after your endpoint returns successfully"*. Issue #5: paid calls returning 500 showed "$0 earned". | ⚠️ **Direct conflict.** This is the most important T-001 question (cases T4–T6, T8). |
| Runtime | Bun on Amazon Linux 2023, aarch64, Lambda-backed | CLI source: "bundles with Bun", "builder Lambda" | Consistent. Arch and OS are new and unverified (T2 reports them). |
| Handler signature | `handler(req, ctx?: BankrX402Context)` | CLI template has `handler(req)` only | `ctx` is new. Its fields are unknown. |
| **Timeout** | **30 s hard cap** (API Gateway), 503 on timeout | Not previously documented. GitHub's 13 MB spec took 9–14 s to diff locally | Plausible. **Design limit: aim for ≤ 20 s worst case.** T8 now tops out at 25 s. |
| Body size | "API Gateway default 10 MB", not confirmed | AWS Lambda synchronous payload limit is 6 MB | ⚠️ Probably ≤ 6 MB. T9 measures it (never above 6 MB). |
| Minimum price | $0.001 "confirmed" | The Bankr marketplace lists a price-`0` service (AUDIT §13 P4). Docs snippet says the minimum is 0.000001 | ⚠️ T11 tests price 0. |
| **`api-smart-diff` version and API** | `^3.0.0`, call `diffSpecs(before, after, {format})` | **Wrong (verified).** The latest on npm is **1.0.6**; no 2.x or 3.x exists. `diffSpecs` is **not exported**. That function is from Atlassian `openapi-diff`. The real API is `apiCompare(before, after)`. | ❌ The brief's sample handler **would fail to build or run**. Don't use it. |
| Sample handler error output | Returns `err.message` to the client | Our rule: sanitize errors, no internal details | ❌ Don't copy. |
| CLI commands | `bankr x402 logs`, `bankr x402 update --price` | **CLI 0.3.45 (latest) has neither** (verified in source). `logs` exists only for webhooks. Price changes use `configure` plus redeploy | ❌ Use the verified commands. |
| Deploy payload | `dependencies` as an array of `{name, version}`, schema `properties` as an array | The CLI sends `dependencies` as an object (from `package.json`) and the schema as standard JSON Schema | Possibly a different format for the agent's `deploy_x402_endpoint` tool. Use the format of whichever tool actually deploys. |
| Routes | One URL per deployment. No sub-routes, so `/v1/analyze` can't exist | Consistent with the CLI (`x402.bankr.bot/<wallet>/<service>`) | **Accepted.** The endpoint will be `…/<wallet>/breakra-analyze`. Docs must not promise `/v1/analyze`. Free discovery routes would each need their own deployment (D-016). |
| Payer identity | `x-402-payer` request header, "router-set, spoof-proof" | New | **Useful for metrics** (unique and repeat paying wallets) without storing request bodies. T2 reports header names. |
| Gas | Bankr covers settlement gas | Consistent with x402 "exact" design | Verify in T-001. |
| Replay | A payment receipt can't be reused | Consistent with x402 (EIP-3009 nonces) | Not testable via a fresh-signing client (T-001-PLAN §2). |
| Fees | Not documented. Won't guess | Secondary sources: free for the first 1,000 requests/month, then 5% | Unknown. T-001 reads `revenue`, which separates `bankrFeesUsd`. |
| Outbound fetch | Allowed | — | T2 verifies. (V0 doesn't need it; URL mode stays deferred under D-014.) |
| Payout wallet | Deploying wallet `0xb98f0de...` (truncated) | — | **Owner must give the full address.** It must differ from the T-001 payer. |
| Upto scheme | Not covered | CLI offers `paymentScheme: "upto"` ("server settles actual cost") | **Open question.** If errors turn out to be charged, `upto` could let Breakra settle $0 on invalid input. We need to know how the handler reports the actual amount (via `ctx`?). |

**Consequence if T-001 confirms "errors are charged":** the brief's rule *"don't charge for known-invalid requests"* can't be met with 4xx responses. Options to bring to the owner:
- (a) the `upto` scheme, if it can settle $0;
- (b) accept it and disclose it clearly in skill.md and the schema, and keep validation cheap and strict;
- (c) a separate free validation endpoint, if price 0 is allowed.

No decision is made until there's evidence.

**§15 addendum (input #5, 2026-10-08): Bankr agent's follow-up answers.**
- **Failed calls:** It repeats that they're charged with no refund, and calls docs saying otherwise "outdated". Still unverified: the docs snippets and issue #5 point the other way. T4–T6 decide.
- **Price 0:** "not supported, likely rejected". T11 tests it as a separate deploy.
- **Upto $0 settlement:** undocumented.
- **Body limit:** undocumented; treat 6 MB as safe.
- **Fee:** undocumented.

**SDK finding (verified in `@x402/fetch` 2.28.0 source):** `wrapFetchWithPayment` re-signs and **re-sends a fresh payment** when `processPaymentResult` reports `recovered`. A client using the stock wrapper could pay twice for one logical call. Breakra's `skill.md` should warn about this. The T-001 client avoids it by using `x402HTTPClient` directly (one signature, no auto-retry).

## 16. T-001 live results (in progress, 2026-10-08)

| Item | Result | Evidence class |
|---|---|---|
| **Price 0** | Deploy rejected: `Price must be a positive number (minimum 0.000001).` → **Free routes are not possible on Bankr.** The minimum price is **$0.000001**. (Bankr's agent earlier claimed $0.001; that was wrong.) | Verified by live deploy (reported verbatim by Bankr's agent) |
| **Platform fee** | `bankrFeeBps: 500` = **5%** on the owner's existing endpoints. Net at $0.02 is $0.019 | Platform metadata, reported by Bankr's agent. **Claude has not seen it directly**; reconcile with T-001 revenue. |
| Payout wallet | `0xb98f0de777eea8c481b64e33d3e0066cea38fa91` on all endpoints | Platform metadata via Bankr's agent; matches the owner's statement |
| **Probe build, revision 1** (with npm dependency `api-smart-diff`) | Accepted, then **the backend build failed twice**: "the hosting backend couldn't finish building or deploying it". No endpoint exists (`api.bankr.bot/.../schema` → "Endpoint not found", checked by Claude). | Verified (the 404 checked by Claude). Cause **unknown**: build logs requested |
| api-smart-diff as the cause? | Unlikely on its own. Its ESM entry is self-contained (no imports, no install scripts) and it bundles locally in 16 ms. The failure may be in Bankr's dependency install or in the deploy config | Inferred |
| Burner payer `0x250265e8Dd7321AcfB495C9Cf1939dD14aD27a75` | Holds **0.04 USDC** (40000 atomic) on Base, 2026-10-08 07:46 UTC | Verified (balance read) |

**Response (probe revision 4):**
- The probe is split into `breakra-t001-probe` (**no dependencies**) and `breakra-t001-lib`, a **pre-bundled single file** with api-smart-diff 1.0.6 inlined and no dependencies.
- That's exactly the D-015 shipping model, so T3 now tests the production approach directly. Both compile and run locally.
- **Consequence for D-016:** free discovery endpoints can't live on Bankr. They have to be served off-platform (GitHub) or as near-free paid endpoints ($0.000001). D-016 stands.

**§16 update:**
- Both rev-4 endpoints are **live** (v1, $0.001 USDC, Base). Verified by Claude via the public schema API.
- The **pre-bundled single file built first try**, while the npm-dependency build had failed twice. That strongly supports D-015: Breakra ships as one self-contained file and asks Bankr to install no dependencies. The root cause of the earlier failure is unproven, because no build logs exist.

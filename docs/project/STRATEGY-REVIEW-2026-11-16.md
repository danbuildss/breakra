# Strategy review: "the safety layer for agent-built software" (owner input, 2026-11-16)

**What this is:** an external strategy write-up the owner pasted on 2026-11-16, after v0.2.0 shipped. It was written by another assistant from a plan summary; parts of it assume v0.2 hadn't started yet. It is saved here, condensed, so it isn't lost. Image embeds and link favicons from the paste are left out; the text is kept as written. **Nothing in it is approved.** Claude's assessment follows the input.

---

## Part A — The input (condensed, wording kept)

### Three lenses (described as strategic lenses, not endorsements)
- **First principles and scale:** don't ask how to make API diffing better. Ask what prevents autonomous coding agents from safely changing production software. What would Breakra need to do for an agent to confidently verify its own changes?
- **Simplicity:** cut configuration, dashboards and friction. Could someone install Breakra in one command and understand in seconds whether their changes are safe?
- **Distribution:** make the core easy to adopt and find repeatable usage. How can Breakra become a default tool in AI coding workflows before revenue is optimised?

### Six ideas
1. **Breakra Impact** (their top pick): examine a repository, find its API calls and map them to the changed contract. Example: an API removes `customer.email`, and Breakra names the files and functions that reference it and the checks needed. Static analysis can't prove runtime breakage. *Opportunity: integration-impact analysis for agent-built apps.*
2. **Breakra Fix:** prepare a reviewable migration patch, update dependent code and run targeted tests. Never silently push or deploy. *Opportunity: a higher-value paid workflow.*
3. **Breakra Watch:** monitor the third-party APIs an app depends on (Stripe, AI providers, payments) and report changes affecting the endpoints it uses. Needs versioned specs. *Opportunity: subscription revenue.*
4. **Breakra for MCP:** compare MCP tool schemas before and after deployment, and say which agent workflows break. Real, but partly served already. *Opportunity: compatibility infrastructure for agent tools.*
5. **Breakra Proof:** verifiable evidence for every decision (contract versions, changes, checks run, reasons) for CI and agent-approval processes. *Opportunity: auditable change decisions.*
6. **Breakra Network:** opt-in, shared non-sensitive compatibility findings: which API versions break, which migrations have verified fixes. Network effects, but long-term and speculative.

### The experience to obsess over
"Update our payments integration to the latest API version, but don't break the existing checkout." The agent changes the code and calls Breakra. Breakra answers **BLOCK**: `POST /payments/checkout` removed the response field `payment_url`; potentially affected file: `src/checkout.ts`; the evidence is the contract diff plus the identified field reference. Breakra then proposes a fix, runs targeted checks, and reports what is verified and what still needs review. (Labelled in the input as a concept, not current functionality.)

### Differentiation
- oasdiff: free comparison, hosted MCP, CLI, Action, YAML, 3.1, endpoint filtering, version-bump checks.
- SpecShield: consumer-aware checks, release blocking, GitHub integration, MCP, a free tier.
- Schemathesis: generated API tests.

Proposed edge: **code-aware impact analysis + agent-native decisions + verified repair workflows**, with customer validation before calling it a moat. "Does this break me?" via endpoint filtering is useful but **not unique**. It should be described as *usage-based filtering*, not full consumer compatibility.

### Roadmap proposed
| Phase | Build | Goal |
|---|---|---|
| Now (v0.2) | Reliable verdicts, YAML, local CLI/MCP, payment correctness | Trustworthy core |
| v0.3 | Breakra Impact prototype for TypeScript/JavaScript | Find real affected code |
| v0.4 | Fix suggestions and targeted validation | Help agents resolve failures |
| Later | MCP contracts, external API monitoring | Adjacent markets |
| Long term | Shared compatibility evidence | Network effects |

For v0.3: recruit 5 developers who maintain real integrations, test on changes they actually hit, and measure whether the identified impact is correct and saves debugging time.

### Positioning and business
- **Tagline:** "Know what breaks before your agent ships." Long-term: "The safety layer for agent-built software."
- Don't make x402 the company's identity: keep it as one payment option next to subscriptions and conventional billing.
- Keep $0.02, but treat hosted revenue as an experiment: 100 / 1,000 / 10,000 calls = $2 / $20 / $200 gross. Don't combine the Fireblocks (~$274k, Oct 2026) and Crypto Briefing ($1.59M) figures; they measure different things.
- Measure local runs, distinct developers, recurring use, hosted calls and which checks people value.

### Conditions the input attached to v0.2
1. Production correctness first: paid behaviour, ambiguous gateway errors, no duplicate charges, and published capabilities matching reality.
2. A narrow, usable v0.2, with OpenAPI 3.1 only after compatibility tests pass.
3. Validate with 5–10 real API developers and see whether they come back unprompted.
4. Keep 2027-01-31 as the review date, but don't let 3 paying wallets be the only criterion: repeated local use and prevented integration problems count too.

**Its central question:** *Can we make Breakra so useful during an actual coding task that an agent or developer chooses to run it again?*

---

## Part B — Claude's assessment (2026-11-16)

### Where v0.2 already stands against the input's conditions
| Condition | Status | Evidence |
|---|---|---|
| Payment correctness, gateway errors, duplicate charges | **Done** | PR #27: the client checks every payment term; gateway 5xx, timeouts and non-JSON responses are "unknown, don't re-sign". BankrBot review findings addressed |
| Published capabilities match the live endpoint | **Done** | Deployed to Bankr (v6) *before* merging #31. The paid V4 `analysis_id` matched local, proving engine 0.2.0 is live |
| OpenAPI 3.1 only after compatibility tests | **Done** | A feasibility probe found an unsafe misread (numeric `exclusiveMinimum` treated as docs); fixed with rule tests before shipping |
| Narrow, usable v0.2 | **Done** | Released as v0.2.0, GitHub Action deferred |
| Validate with 5–10 developers | **Not done** | The real gap. Nothing in v0.2 has outside users yet |
| Broader success criteria | **Open** | See below; local use isn't measurable today |

### Agree
- **Impact is the strongest next bet.** It answers something oasdiff doesn't, and it matches the one integrator signal we have (CashBoard). It can stay **deterministic** (no LLM), in line with our principles: a parser finds API calls (paths, methods, fields) in TS/JS code and joins them to the contract diff. It's honest about limits: string-built URLs and dynamic access stay "unknown".
- **Wording fix needed now.** VISION and the README say Breakra tells you whether a change "breaks **you**". With `uses`, it **filters findings to the operations you list**; it doesn't analyse your code. I recommend rewording to "shows which findings touch the operations you use". Small docs change; needs your OK.
- **x402 isn't the identity.** This is already the stance in D-039 (open core; hosted sells convenience).
- **Revenue is an experiment.** Agreed. Measure use, not dollars.

### Disagree or caution
- **Fix:** "generate a migration patch" means code generation, which in practice means an LLM. Breakra's principle is no LLM in the analysis path. Better split: Breakra returns **structured, deterministic fix instructions** (the field renamed X→Y, the param now required, the file and line); the user's own coding agent writes the patch. Same experience, no LLM inside Breakra, and it stays verifiable.
- **Watch** needs a scheduler, storage and per-user state: everything V0 ruled out (no DB, no monitoring). Not before Impact proves demand.
- **Network** needs scale we don't have. Park it.
- **MCP schemas** is actually a cheap adjacent test. Our engine already diffs JSON Schema, and MCP tool definitions are JSON Schema. Worth a one-week spike *after* Impact, not before.
- **"Repeated local use" as a criterion:** we have **no way to measure it**. The CLI and MCP deliberately send no telemetry (privacy principle). Workable proxies: npm downloads (after an npm publish), GitHub stars and clones, and interview follow-ups. I'd keep it that way and **not** add telemetry.
- **SpecShield** consumer-aware checks and its free tier: I haven't verified these myself (its site wasn't reachable from the sandbox; earlier searches found no pricing). Treat as unconfirmed.

### What I'd do next (needs approval; nothing started)
1. **Now, small:** reword the `uses` claims (VISION, README, SKILL.md, site) to "usage-based filtering".
2. **Owner:** recruit **5 developers** who maintain real API integrations (ideally TS/JS). Ask each for one real API change that bit them. This tests whether they come back unprompted, and gives v0.3 its test cases.
3. **v0.3 spike (about 1–2 weeks), once 2 or 3 real cases exist:** a deterministic **Impact prototype for TypeScript/JavaScript**. It takes a repo path and two contracts, and reports which files and lines reference changed operations and fields, with "unknown" where code is dynamic. It is measured against those real cases: precision, recall, and whether it saved debugging time.
4. **Defer:** Watch, Network and a Fix that writes code. Revisit MCP schemas after v0.3.
5. **Update D-039's kill criterion** to: ≥ 3 repeat external wallets **or** ≥ 3 of the 5 developers using Breakra again unprompted on a real change, by 2027-01-31.

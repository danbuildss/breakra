# Breakra — Working Notes

*(Formerly "Specshift": rejected as a brand on 2026-10-08, see D-018. The appendices keep the original owner inputs verbatim, including the old name.)*

> **WORKFLOW RULE (always):** Before building, integrating or changing anything, read this file first to know where we are. Every decision, input and step we take gets recorded here.
>
> **Then follow `CLAUDE.md`** (the operating manual). It requires reading PRODUCT → PLAN → DECISIONS → ARCHITECTURE → TASKS → TESTING → LAUNCH, inspecting the repo, and then doing one approved task at a time. Doc precedence: owner's latest explicit decision > DECISIONS.md > PRODUCT.md > ARCHITECTURE.md > PLAN.md > task notes.

---

## Current status

- **Repo:** The session remote is `danbuildss/specshift`. **GitHub now reports the repo as `danbuildss/breakra`** (renamed outside this session; verified by the push response on 2026-10-08; AUDIT §13 P3). The old URL redirects. Never `somehow-internet/*`.
- **Company:** Somehow (Somehow Internet) is the owner's company, for business and admin only. **Breakra is independently branded. No "Built by Somehow" attribution without approval** (D-019).
- **Name:** **Breakra** (D-018). History: "API Change Intelligence" (not brandable), then "Specshift" (rejected; a same-category competitor), then Breakra. Domain and trademark clearance is still open.

- **Phase:** **5, Step 1 (preparation)** (D-033). Demo, metrics script and launch kit ready. **Engine 0.1.1 live (v4, D-034).** **Gate cleared 2026-10-09** (owner's trademark search: no results). Day 1 = the owner's first post. `breakra.dev` planned later.
- **Public:** `github.com/danbuildss/breakra` is public (MIT). Agent guide: `skill.md`; contract: `openapi.json`.
- **Live:** `POST https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze`, **v4** (engine 0.1.1), $0.02 USDC on Base, deployed from `main` @ `cc98f7c` (listing links to SKILL.md). Limits per D-031 (1 MB body, 75 k expanded nodes).
- **What exists:** `src/` (engine), `tests/` (65 tests), `scripts/` (build, smoke, oracle, bench, verify-live), CI, and docs (RULES.md, docs/API.md, docs/DEPLOYMENT.md, BENCHMARKS.md, ARCHITECTURE.md).
- **Wallets:** burner **0.004 USDC** (no paid checks left; top up before any more). Payout 0.243661 USDC.
- **Open owner items:** domain and trademark clearance for Breakra (blocks promotion in Phase 5, not deployment). License decided: MIT (D-032).

## Sprint log (Oct 16 – Nov 12, 2026)
- **2026-10-15:** The owner opened a four-week validation sprint (audit → research → plan → approval). Claude drafted `docs/project/SPRINT-2026-10-AUDIT.md`:
  - Product audit and experiment scorecard. The scorecard is pending owner metrics; there are 0 external wallets at the last count.
  - Market research. Key finding: **oasdiff runs a free, keyless hosted MCP** with YAML and 3.1 support.
  - A metrics-miscount review: other $0.02 services and unlisted owner wallets could be miscounted.
  - Vercel terms: the Hobby plan is non-commercial; the owner must confirm the plan.
  - Safety issues S1–S7, an owner verification guide, and the Week 1 task board.
- **2026-10-15:** Logged feedback (relayed by the owner) in EXPERIMENT.md:
  - Alex: installable agent skill.
  - Story91: CashBoard interest, with integration/payment confusion; use case unconfirmed.
  - Noaman: site colour scheme (design only).
- Live endpoints are unreachable from Claude's sandbox (proxy 403), so live checks are the owner's to run.
- Nothing implemented, deployed or spent. Waiting for owner approval.
- **2026-10-15:** Owner approved Week 1 (verification, reconciliation, follow-ups, outreach planning) and item 9.
  - Item 10, the paid check, is not approved.
  - Safety PR opened: danbuildss/breakra#24. CI and CodeQL are green.
- **2026-10-15, step 1 passed** (free live check): site 200 ×4; 402 with the correct terms through breakra.dev and direct.
- **2026-10-15:** Owner confirmed the **Vercel plan is Pro**, so commercial use is permitted and S1 is resolved.
- **2026-10-15, step 2 (Bankr records):**
  - breakra-analyze v5: **6 paid requests all time ($0.12, $0 fees)**, the same number as the known self-paid calls, so most likely **0 external**.
  - Other services on the same account and wallet: CORTX ×2 ($0.01, $0.001) and market data ×4 ($0.001). None at $0.02.
  - Separation from CORTX exists only at Bankr's per-service level.
- **2026-10-15, step 3 (on-chain, Alchemy): RECONCILED.**
  - 6 Breakra calls on-chain = Bankr's 6, all self-paid (5 on Oct 8, 1 on Oct 9). **0 external paying wallets.**
  - No Breakra payment of any kind since Oct 9.
  - The continue bar is not met (0 of 3) at day 7.
- **2026-10-15, step 6:** BankrBot/skills#771 and awesome-x402#1766 are still open with no reviews; X post 2 not posted.
  - Verification steps 1–6 complete; the paid check (step 7) is still not approved.
  - Drafted `docs/project/launch/outreach-week1.md` for approval: Story91/Alex/Noaman follow-ups, a 10–15 person targeted list (segments A/B/C) and measurement.
- **2026-10-18:** The owner asked for "Built by SOMEHOW" (link: somehowinternet.app) at the bottom of breakra.dev. They approved option B (own line, left-aligned, below the footer) from desktop and mobile previews. Recorded as a D-019 amendment.
- **2026-10-18:** The owner said there's no need for the outreach drafts, so they were removed from the PR; the owner handles follow-ups and outreach directly. X post 2 is still not posted.
- **2026-10-29 (BankrBot reviewer on BankrBot/skills#771, changes requested):**
  - **breakra.dev was down:** HTTPS refused, and HTTP served a Namecheap contact-verification page. Likely cause: the registrant email was never verified after the purchase around Oct 9 (inferred).
  - **Affected:** the site, `/skill.md`, `/openapi.json`, the `/api/analyze` forward and the x402scan listing. The direct Bankr endpoint kept working (reviewer got a 402).
  - **The outage start date is unknown.**
  - The reviewer's other findings, both valid:
    - SKILL.md says "any other status means you didn't [pay]", which is wrong after a gateway 5xx (double-charge risk).
    - `examples/client.ts` doesn't check `payTo`, `maxTimeoutSeconds` or `assetTransferMethod`.
  - Fix plan (B: client and SKILL.md PR; C: update the fork and draft a reply) proposed; **awaiting owner approval**.
- **2026-10-30:** The owner verified the registrant email at Namecheap ("Registrant email address successfully verified"; breakra.dev and musecourt.xyz reactivate "usually within 24–48 hours"). **breakra.dev isn't confirmed back up yet**; re-run the step 1 check after reactivation.
- **2026-10-30:** The owner approved B and C. **B is done** (PR for review):
  - `examples/client.ts` now refuses to sign unless every term in SKILL.md's table matches. That includes `x402Version` 2, `payTo` = the router, `maxTimeoutSeconds` ≤ 60, and `assetTransferMethod` absent or `eip3009`.
  - After signing, only Breakra's own JSON error or an x402 402 counts as "not charged". Gateway errors, non-JSON bodies, timeouts and resets count as **unknown** (don't re-sign; wait 60 s and check the wallet).
  - SKILL.md (and its launch copy) say the same.
  - 14 new tests; `bun run check` passes with 124 tests.
  - **C** (update the fork for BankrBot/skills#771 and draft the reply) follows once B merges.
- **2026-10-30:** The owner merged PR #27 (B).
  - **C step 1 done:** the fork branch `danbuildss/skills:add-breakra` now carries the updated `breakra/SKILL.md` (commit `86a8dc1`, author Dan, no AI attribution), so BankrBot/skills#771 shows it.
  - The reply to the reviewer is drafted; the owner posts it after confirming breakra.dev is back.
- **2026-11-16:** The owner asked for research on upgrades and the niche, a vision, and to build everything at once.
  - **Research** (searches; the Circle and dev.to sites were blocked from the sandbox):
    - The problem is real. Agent-written breaking changes are now studied, and new MCP tools target them (SpecShield, OpenAPI Contract Guard).
    - oasdiff's hosted MCP is still free and supports 3.0, 3.1 and 3.2.
    - x402 spending is small and falling: Oct 2026 about $274k; agent payments down 94.5%; genuine share estimated at 0.6–7.5%. Search and market data dominate.
    - Circle's marketplace (900+ endpoints) has no developer-tools category.
  - **Verdict:** a useful niche, but generic pay-per-diff won't win. Breakra must answer "does this break me?", give a verdict, and be free to try.
  - Owner approved everything: **D-039**.
  - **Built:** engine 0.2.0 (verdict, semver advice, `uses` impact, YAML, OpenAPI 3.1), a free local CLI and MCP server, docs, `VISION.md`, CHANGELOG, distribution kit. 160 tests.
  - **Found and fixed:** under 3.1 a numeric `exclusiveMinimum` was read as documentation, so a tightened request showed as "compatible".
  - **Bundle:** 94.8 KB. The guard was raised to 99 KB; Bankr's real limit is unknown between 91 and 137 KB.
  - **Deploy order:** Bankr first, then merge.
- **2026-11-16:** Owner deployed engine 0.2.0 to Bankr: **v6**, same URL, $0.02. The 94.8 KB bundle was accepted. Next: V0 (free), the optional paid V4 (not yet approved), then merge PR #31.
- **2026-11-16: v0.2.0 released.**
  - V0 passed.
  - **V4 passed** (paid $0.02): the live `analysis_id` equals the local one, so Bankr runs engine 0.2.0.
  - The owner merged #31 and tagged `v0.2.0`; the Release workflow succeeded.
  - Next: the distribution kit (Circle, Bankr email, MCP registries, skills directories) and the fork update for BankrBot/skills#771.
- **2026-11-16:** Fork updated: BankrBot/skills#771 now carries the v0.2 SKILL.md (`34010d5`, author Dan).
- **2026-11-16:** The owner pasted an external strategy review ("the safety layer for agent-built software"). Saved and assessed in `docs/project/STRATEGY-REVIEW-2026-11-16.md`.
  - Its v0.2 conditions are met except **validation with 5–10 real developers**.
  - Claude agrees **Breakra Impact** (deterministic code-aware impact for TS/JS) is the best next bet. Fix should return deterministic fix instructions, not LLM patches. Watch and Network are deferred.
  - Wording fix proposed: `uses` is usage-based filtering, not code analysis.
  - Kill-criterion amendment proposed. **Nothing approved yet.**
- **2026-11-16:** Owner approved all four recommendations (**D-040**).
  - `uses` wording fixed everywhere.
  - VISION roadmap: v0.3 = Breakra Impact.
  - The success test now also counts 3 of 5 developers returning unprompted.
  - The owner recruits 5 developers; Impact starts once 2–3 real cases exist.
- **2026-11-16:** Owner merged #32. **Circle agent-readiness score for breakra.dev: 90/100 (A)**, 10 of 12 checks pass, runtime-verified (an unpaid call returned a valid 402).
  - **Valid OpenAPI 3.1: 0/5.** Our `openapi.json` declared 3.0.3; it's now converted to 3.1.0 (`nullable` → type lists, `example` → `examples`), expected +5.
  - **Multi-chain payment: 0/5.** Bankr offers Base only; fixing it needs self-hosted x402 (VISION "After that").
  - Capabilities "Schema in 402", nanopayments, wallet auth: not detected (Bankr's 402 has no Bazaar extension).
- **2026-11-20:** The owner sent a master handoff (strategy, distribution, roadmap), a self-maintaining-APIs memo, a BlockRun note and an MCP/x402 security addendum. Claude audited them against the repo: `docs/project/ROADMAP-2026-11-20.md`.
  - **Confirmed:** blanket "errors are free" claims in 15+ public files (a double-charge risk for agents); version and 3.0 drift; a duplicate SKILL.md; the npm name `breakra` is free; `package.json` isn't publishable (private, TS bin, `Bun.YAML`).
  - **New:** MendAPI (npm v0.5.0) already ships code-impact scanning + an MCP server + migration diffs, so Breakra Impact needs a teardown before any build.
  - **Not confirmed by search:** Impact Gate, cisco mcptoolkit-contract, Settlens, x402Shield.
  - **Owner-reported:** Circle application submitted 11-16; skills.sh listing; scanner verdicts FAIL/WARN/WARN (details pending).
  - **Proposed first task:** PR A (docs and agent safety). Awaiting approval.
- **2026-11-20:** Owner approved PR A and confirmed **the Circle Agent Marketplace listing is submitted**; awaiting Circle's review.
  - **PR A done:** precise payment wording in every public file (Breakra's own errors are never charged; a gateway failure is an unknown outcome); "Safety rules for agents" block at the top of SKILL.md; one canonical SKILL.md (launch copy removed); version drift fixed (README, API.md, `openapi.json`, hero image).
  - New tests guard all of this; 163 tests pass.
  - **After merge:** sync the fork for #771; Bankr redeploy for the listing text (free V0 only).
- **2026-11-20:** Owner merged PR A (#35) and shared the scanner reports (all audited Nov 16, before PR A).
  - **Gen Agent Trust Hub FAIL (CRITICAL label):** every category passed; the only flag was `delvra.website`, a third-party domain linked in `AUDIT.md` naming research, which its own analysis rated SAFE. Fix: domains defanged, record kept.
  - **Socket WARN (low):** `scripts/lib/github-slice.ts` passed an unvalidated version to a shell. Fix: semver check plus `execFileSync` with no shell; test added.
  - **Snyk W011** (contract text echoed in `evidence`, 0.10): SKILL rule 5 now names `evidence`, `reason` and `limitations` as untrusted data.
  - **Snyk W012** (runs code from a personal repo): the clone is pinned to the v0.2.0 tag, and SHA256SUMS is referenced. npm (PR B) is the fuller fix.
  - **Tessl 64 / 80%:** it scored the deleted launch copy at `099ee23` (pre-PR A); re-run against the root.
- **2026-11-20:** Owner merged #36 and redeployed Bankr **v7** (listing wording corrected; V0 pass). The catalog example now leads with the free local run. Fork for BankrBot/skills#771 synced (`98f0ad5`, author Dan): SKILL.md, `catalog.json`, README row. Next: the owner comments on #771 and requests re-review.
- **2026-11-20:** Owner approved PR B. Built the npm package `breakra` 0.2.1 (**D-041**): Node ≥ 20, one dependency-free file, YAML via `yaml`, the engine unchanged. `npm-smoke` passes on Node 22 (clean install outside the repo: CLI + MCP; Node/Bun parity). Not published: the owner publishes.
- **2026-11-20:** **`breakra@0.2.1` is live on npm** (owner; needed 2FA with a security key). Claude's clean `npx` test found two MCP bugs (EPIPE crash on client disconnect; `serverInfo` showed the engine version), fixed in **0.2.2**. The same PR adds `server.json` (validated against the official 2025-12-11 schema) and `glama.json`, and switches the docs to `npx -y breakra`. 178 tests pass; npm smoke includes a disconnect test.
- **2026-11-20:** #38 merged. **npm 0.2.2 live; official MCP Registry `io.github.danbuildss/breakra@0.2.2` published and active** (verified via the registry API). The owner reports **Glama, Tessl and skills.sh approved**. Pending: Circle review and the Bankr PR #771. Distribution Stage 1 (roadmap) is essentially done except tagging v0.2.2.
- **2026-11-20:** The owner tagged v0.2.2, posted the reply on #771 and contacted the Bankr team; X launch post drafted with 2 images. The owner wants a website upgrade modelled on **1claw.co** (header mega-menus + footer); ratspeak.org and aeon.fun are secondary. Plan saved: `docs/project/WEBSITE-V2-PLAN.md`, including 1Claw-inspired roadmap items (examples/CI recipes, docs site, library export, agent-framework plugins, llms.txt). **Order: PR D (benchmark) first, then website v2.**
- **2026-11-20, PR D (benchmark) built:**
  - GitHub 17→24 (7 pairs): block 2, review 4, safe 1.
  - Stripe (4 pairs): 2 not assessed (every changed path exceeds 75k expanded nodes), 2 no changes.
  - 382 changes: 1% breaking, 14% potentially breaking, 3% unknown, 61% compatible, 21% docs-only.
  - Curated: 15/15 as expected.
  - Hand-checked: all 3 operation removals confirmed absent from the full later specs; `oneOf` property removals in GitHub 18→19 are likely over-reporting (position-based variant comparison).
  - First selection rule was wrong (it reported Stripe as "safe" with 0 paths compared): fixed before publishing.

## Inputs received

| # | Date | What | Where |
|---|------|------|-------|
| 1 | 2026-10-08 | Specshift Master Product & Engineering Brief v1.0 | [Appendix A](#appendix-a--specshift-master-product--engineering-brief-v10) |
| 5 | 2026-10-08 | Owner wallets (payout `0xb98f…fa91`; Rabby `0x9E84…719D`) + Bankr agent's answers to T-001 §2 questions | T-001-PLAN rev 3 §1–2, AUDIT §15 addendum |
| 4 | 2026-10-08 | Bankr agent's technical brief on x402 Cloud for Breakra (forwarded by owner; owner wants Bankr to host and deploy) | [Appendix D](#appendix-d--bankr-agent-technical-brief-input-4); cross-checked in AUDIT.md §15 |
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
- **2026-10-09:** Directory PRs open: **BankrBot/skills#771** (Breakra skill) and **xpaysh/awesome-x402#1766** (Developer Tools). Logged in EXPERIMENT.md.
- **2026-10-09:** Owner merged PR #22; reports: **security switches done**, **Bankr skills PR opened**, Bankr email later. Clarified X post 2 = a separate demo post for day 2–4; made `docs/assets/x-demo.png` (1600×900, from the real demo card) and trimmed the text to fit 280. Wrote browser-only awesome-x402 steps (Developer Tools, after BountyVerdict).
- **2026-10-09:** Owner merged PR #21. **x402scan: registered** `breakra.dev` (1 resource, `/api/analyze`); one non-blocking warning from Bankr's 402 (no top-level `resource`). **V0 released:** tag `v0.1.1` had already been pushed (at the PR #17 merge) and the Release workflow published "Breakra v0.1.1" with the bundle and SHA256SUMS. Remaining: Bankr skills PR, email Bankr, awesome-x402, X replies, security switches.
- **2026-10-09:** Owner merged PR #20; `npx @agentcash/discovery breakra.dev -v` found the spec and `POST /api/analyze paid 0.02 USD [x402]`. Remaining audit errors come from Bankr's 402 body (no top-level `resource`, no `extensions.bazaar`); added to the Bankr request. Added `info.x-guidance`. x402scan's button is "Add your API" → `breakra.dev`.
- **2026-10-09:** Owner merged PR #19 and topped up the burner ($0.20). **Paid call through breakra.dev/api/analyze verified:** 200, matching `analysis_id`, settled once (burner 184000, payout 267661). SKILL.md now names the breakra.dev endpoint. Next: `npx @agentcash/discovery breakra.dev -v`, then x402scan Add Server.
- **2026-10-09:** **Day 1 of the 14-day experiment:** owner posted the launch on X (https://x.com/danbuildss/status/2108486248004260253). Owner merged PR #18 and ran the probes: Bankr's 402 has **no `extensions.bazaar`**, and `x402.bankr.bot` has no OpenAPI → x402scan can't register the Bankr URL. Owner approved **B** (breakra.dev/api/analyze forwards to Bankr; D-038) and asked for draft **A** (request to Bankr).
- **2026-10-09:** Owner chose **hello.danbuilds@gmail.com** as the public contact email (a `hello@breakra.dev` mailbox was judged too costly for now) → added to `openapi.json` `info.contact.email` (PR #18).
- **2026-10-09:** Owner merged PR #17. x402scan registration failed (`Missing input schema`; contact warning). Claude traced it in x402scan and @agentcash/discovery source: for Bankr-hosted URLs, the schema must come from Bankr's 402 (`extensions.bazaar`) or `x402.bankr.bot/openapi.json`; neither is ours. Fixed our `openapi.json` for discovery (paid, x402 price, real path, contact url; offline check clean). Asked the owner for Bankr's 402 body. Owner reports having forked BankrBot/skills.
- **2026-10-09:** Owner merged PR #15 and #16; site deployed on Vercel. **V0 docs pass** (owner: "give me the PR" after "approve 2" was offered): links switched to breakra.dev; `/skill.md` and `/openapi.json` published by the Vercel build (copied from the repo root, single source); LAUNCH.md checklist ticked; rate-limit note in docs/API.md; X reply trimmed to fit 280. Claude can't reach breakra.dev from its sandbox (proxy 403), so the live site is verified by the owner only. Next: tag v0.1.1 = V0.
- **2026-10-09:** Owner reported the CodeQL check failing on PR #15. Claude reproduced it locally with the CodeQL CLI: one alert in new test code (regex HTML tag-stripping in `tests/site.test.ts`), plus pre-existing noise (`examples/client.ts` by design, archived `experiments/`, an unused value in `scripts/bench.ts`). Fixed; added `.github/codeql/codeql-config.yml`; local re-run: 0 results.
- **2026-10-09:** Owner merged PR #12, enabled private vulnerability reporting, uploaded the social preview, merged Dependabot PR #13, and **bought breakra.dev** (Namecheap). Owner chose **our brand palette** (not the ChatGPT ice-blue proposal) and **Vercel** for hosting → **D-037 approved** ("approve the landing page"). Built `site/` (static page, real example, self-hosted Geist, strict CSP in `vercel.json`), `tests/site.test.ts`, owner guide `docs/project/launch/website.md`. CLAUDE.md's no-frontend rule is relaxed for this informational page only (recorded in D-037). X post (day 1) still pending.
- **2026-10-09:** Owner shared reference repos (aeon, x402, BankrBot/skills), wants a more organised README, workflows and graphics in black / white / off-white → **D-036 approved (A B C D)**. Built: new README, SVG brand assets + PNG social preview and X image, Dependabot/CodeQL/Release workflows, internal docs moved to `docs/project/` (CLAUDE.md paths updated). Bankr skills: owner forks, Claude pushes to the fork, owner opens the PR. Owner asked to hold merging and posting until everything is ready.
- **2026-10-09:** Owner merged PR #11 and filled in the GitHub About box (description, website, topics). Owner wants Breakra as an open-source project people can contribute to → **D-035 approved (A and B)**: CONTRIBUTING.md, SECURITY.md, issue templates (incl. *Report a wrong finding*), PR template; ready-to-upload BankrBot/skills folder in `launch/bankr-skills/` (format verified against their repo). Clarified: none of the day-1 steps need the domain.
- **2026-10-09:** Owner's trademark search for "Breakra": no results → gate cleared. Metrics verified with the owner's Alchemy RPC: 5 self-paid Breakra calls, 0 external, 22 other-service payments. **The owner pasted their Alchemy key in chat; Claude advised rotating it and did not record it.** Step 1 complete; day 1 starts with the owner's first post.
- **2026-10-08:** PR #9 merged; owner redeployed **v4** (engine 0.1.1). V0 passed; the live demo check matched (`sha256:c17639a1…ddc1`). D-034 accepted. Burner 24000 → 4000.
  - First `bun run metrics` failed on the public RPC's rate limit; fixed (backoff, fallback RPC). Owner says they will buy the .dev domain later.
- **2026-10-08:** **Owner approved Phase 5** (channels X + GitHub + directories; continue bar OK) → D-033.
  - Built: `PHASE-5-PLAN.md`, `EXPERIMENT.md`, demo `demo/github-rest-api/` (GitHub REST API Dec 2025 → Oct 2026: 5 breaking, 35 potentially breaking), `bun run metrics` (on-chain, owner-run), launch kit `launch/`.
  - **Found two live bugs while checking the demo by hand (D-034, proposed):** a required parameter or request body added via `$ref` was reported as optional/compatible with name `?`; api-smart-diff's console.error could leak spec paths into Bankr logs. Fixed in engine 0.1.1 with regression tests; awaiting owner approval and redeploy.
  - Directory research: best fit is Bankr's skills catalog (BankrBot/skills); CDP Bazaar doesn't index Bankr-settled endpoints; x402.org ecosystem page is gone. Renamed `skill.md` → `SKILL.md` for skill tooling.
  - Container can't reach Base RPCs, so the metrics script must run on the owner's machine.
- **2026-10-08:** **Phase 4 COMPLETE.** PR #7 merged; repo made public (GitHub API: public, MIT). The owner redeployed **v3** (listing now links to skill.md); V0 passed.
  - **Live cold-agent run:** the client written from skill.md alone paid $0.02 and got a 200 with the matching `analysis_id` (`sha256:39f62e04…2593`), server 634 ms.
  - Reconciled at 21:13 UTC: burner 44000 → 24000, payout 203661 → 223661 (0% fee). Phase 4 spend: $0.02.
  - Side note: the owner's machine prints "Update available: 0.3.1 → 0.3.45" for the Bankr CLI (a stale binary earlier on PATH; deploys still work).
- **2026-10-08:** **Owner approved Phase 4, option A, MIT (D-032)** after merging PR #6.
  - Built `skill.md`, `openapi.json`, `examples/` (request, generated response, safe paying client, curl), MIT `LICENSE`, `tests/docs.test.ts` (keeps docs in sync), new Bankr listing text with the skill link, and a buyer-facing README.
  - Scanned git history before going public: no keys or secrets. Commit author emails and wallet addresses will become public.
  - Cold-agent test: a fresh agent given only skill.md wrote a working client (mock: 200, matching `analysis_id`). It found 9 gaps in skill.md (e.g. the expected `payTo` was missing); all fixed.
  - Waiting on the owner: the live cold-agent run, making the repo public, and a redeploy so the listing shows the new text.
- **2026-10-08:** **Phase 3 COMPLETE.** PR #5 merged; the owner redeployed from `main` (**v2**, `bun run check` passed, 90,521 bytes).
  - V0 passed: 402, 20000, router.
  - **V6 passed:** 940 KB real pair → 200, 290 changes, `analysis_id` = local. **8,097 ms server, 17,923 ms client**, under the ≤ ~9 s target.
  - Claude reconciled at 20:55 UTC: burner 64000 → 44000, payout 183661 → 203661 (0% fee).
  - Phase 3 spend: **$0.06** (V4, V5, V6) of the $0.10 cap.
  - Wrap-up docs PR opened. **Phase 4 (agent distribution) proposed; awaiting approval.**
- **2026-10-08:** **Owner approved D-031:** body 2 MB → 1 MB, expanded nodes 400 k → 75 k. Implemented and checked locally and against mock Bankr (V5 now 413 free; new V6 = 940 KB near-limit pair, 200 with a match). PR → the owner merges, redeploys (`cd dist && bankr x402 deploy breakra-analyze`), then runs V0 and V6 ($0.02).
- **2026-10-08:** **Breakra is LIVE** on Bankr: `https://x402.bankr.bot/0xb98f…fa91/breakra-analyze` (v1, $0.02, POST). The first redeploy needed a write-enabled Bankr API key.
  - **Verification V0–V6 all pass:**
    - 402 terms are exactly 20000 to the router.
    - Invalid input (400) and the ref bomb (422) were not charged.
    - V4 and V5 returned 200 with **`analysis_id` identical to local**.
    - Burner −0.04 and payout +0.04 (0% fee).
  - **Finding:** Bankr is about 9× slower. V5 (2 MB real pair) took 16.7 s server and 26.7 s end to end, against the 30 s cap. Proposed tightening the limits (D-031).
  - Phase 3 spend: $0.04 (4 of 5 signed attempts used).
- **2026-10-08:** PR #3 merged. The owner ran `bun run check` on their Mac (65/65 pass, smoke OK), then `bankr x402 deploy breakra-analyze`, which **failed with 413 Payload Too Large** (137 KB file). Nothing deployed or charged.
  - **Fix (D-030):** minified build plus a direct call to `compareOpenApi`; now a 90.5 KB file (about 95 KB request), with size guards in build and smoke.
  - **Re-verified:** all checks pass; mock-Bankr V0–V5 pass with matching `analysis_id`s.
  - **Next:** PR #4 → the owner merges, rebuilds and redeploys.
- **2026-10-08:** **Owner approved Phase 3, option A (D-029).** Claude completed T-301:
  - `docs/DEPLOYMENT.md`: prerequisites, build, CLI deploy, verification, pause/rollback/remove, monitoring.
  - `scripts/verify-live.ts`: checks terms before signing, 20000 → router, one signature, 5-attempt cap, compares `analysis_id` with the local result.
  - `scripts/lib/github-slice.ts`.
  - **End-to-end test against a mock Bankr wrapping the built handler:** V0 402 ✓; V1 400 ✓; V3 422 ✓; V4 200 with matching `analysis_id` ✓; V5 (1.94 MB GitHub slice) 200 with a match, about 2 s ✓; wrong price aborts unsigned ✓.
  - The `src/` engine is unchanged from `main`.
- **2026-10-08:** Owner merged PR #2. GitHub Actions CI passed on the PR (run 37836292583) and on `main` (run 37837847635). Branch reset onto `main`. Claude wrote `PHASE-3-PLAN.md` (deploy via CLI, live verification V0–V6, $0.04 expected / $0.10 cap).
- **2026-10-08:** **Phase 1 COMPLETE.** Core engine built:
  - **Validation:** limits, plus a ref-bomb guard (a 2 KB bomb would otherwise produce about 200 k diffs).
  - **Comparison and rules:** api-smart-diff wrapper and rule set 0.1.0 (RULES.md).
  - **Delivery:** deterministic response (docs/API.md), the handler, and a single-file build (about 137 KB).
  - **Tests:** 65 tests. The oasdiff v1.33.0 oracle shows 3 documented differences, where Breakra is stricter. The smoke test passes under Bankr's Bun 1.3.14.
  - **Benchmarks:** real 1 MB spec pairs take about 1.7 s locally (BENCHMARKS.md). Limits calibrated: expanded cap 1.5 M → 400 k; response ≤ 500 changes and 1,000-char evidence (D-028).
  - **CI:** GitHub Actions workflow added.
  - **Delivery:** PR to `main`. Nothing deployed.
- **2026-10-08:** **Owner approved Phase 1 (D-027); D-023 to D-026 accepted.** Claude started T-101.
- **2026-10-08:** Test endpoints **deleted** (verified). **Phase 0 is fully complete.** Claude wrote `PHASE-1-PLAN.md` (T-101 to T-108, error contract, test plan, acceptance criteria, risks). **Waiting for "approve Phase 1"**, which also approves D-023 to D-026.
- **2026-10-08:** **T3 on lib v2 PASSED** (200, `diffs:1`, 98 ms; charged). **T-001 COMPLETE**, total cost 0.016 USDC. Summary in AUDIT §17. Proposed D-023 to D-026 (4xx-free errors and 2xx only on success; 2 MB / 20 s limits; single-file bundle via the CLI; payer metrics without logging IPs). Next: the owner sends Message B (delete endpoints) and approves Phase 1.
- **2026-10-08:** Bankr's agent sent the T3 failure log: `ReferenceError: getErrorMessage is not defined`. That symbol isn't in our file. **v1 was deployed from a truncated copy** (the agent admits it), and v2 also differs from our file. Lesson: deploy large handlers with the **Bankr CLI**, not via the agent. Next: the owner tests T3 on v2; if it fails, they `bankr x402 deploy breakra-t001-lib` via the CLI and re-test. Then Message B (delete).
- **2026-10-08:** PR #1 merged into `main`; the branch was reset onto `main`. **Basescan reconciliation: no on-chain charge for any failed call, so "only 2xx is charged" is verified on-chain.** The 15th charge (about 08:23 UTC) was a new successful call the client didn't log; it can't be a late failed-call settlement because authorizations expire after 60 s. **Owner approved deleting both test endpoints.** BANKR-HANDOFF rev 4: Message A (lib logs and redeploy), Message B (delete). Remaining: the T3 retest, then deletion, then the T-001 summary and the Phase 1 approval.
- **2026-10-08:** Owner asked for a full status summary and a PR merging all work into `main`. `main` didn't exist, so Claude created it from the first commit (`e8735af`) and opened a PR from `claude/vigilant-allen-nnfhn2`. T-001 is still open (one unexplained charge; lib redeploy unconfirmed).
- **2026-10-08 (19:14 UTC):** T3 retest: blank 500 again, not charged (redeploy unconfirmed; asked the owner). **Reconciliation: 14 expected charges, 15 actual. One unexplained.** The owner is checking the burner's Basescan USDC transfer list. The settlement conclusion is provisional until then.
- **2026-10-08 (19:12 UTC):** T10 passed (128 MB OK, RSS about 193 MB). Burner 25000; **total T-001 cost $0.015.** Still open: attribute the 2 extra charges (owner's results.jsonl) and the T3 retest after the lib redeploy.
- **2026-10-08 (19:10 UTC):** **T12 passed: replay rejected ("Payment already used").** Burner 26000 (−3000 since T9: T12 plus 2 unattributed; asked the owner for results.jsonl). The payout wallet's +9000 includes non-T-001 income, so the burner is now the cost meter. Remaining: T10 (if not run) and the T3 retest once the lib is redeployed.
- **2026-10-08:** T9: 100 KB, 1 MB and 4 MB → 200 (charged); **6 MB → 413 at the gateway before payment (not charged)**. Limit is between 4 and 6 MB. Proposed Breakra cap: ≤ 2 MB total. Spent $0.011 (11 charges, 15 attempts). Remaining: T10 (memory), T12 (replay), T3 retest once the lib is redeployed.
- **2026-10-08:** T8a/b/c (5/15/25 s): all 200 and charged; about 1–2.5 s platform overhead. Design limit: ≤ 20 s handler time. Spent $0.008 (8 charges, 12 attempts). Next: T9 body sizes.
- **2026-10-08:** **T6 (throw → blank 500): NOT charged. T7 (2×200): charged twice**, which is the positive control and rules out lag. **VERIFIED: Bankr charges only for 2xx.** 400, 500, throw and load failure are all free to the caller. Bankr's agent was wrong; the docs were right. Spent $0.005 (5 charges, 9 attempts). Next: T8a (5 s sleep).
- **2026-10-08:** **T5 (handler 500): NOT charged.** Next: T6 (throw).
- **2026-10-08:** **T4 (handler 400): NOT charged** (balances unchanged; 485 ms vs 1–3 s for paid 200s). This contradicts Bankr's agent and matches the docs. Lag re-check at T5. Next: T5.
- **2026-10-08:** **T3 failed: blank 500, NOT charged** (2 charges for 3 calls since T1). Likely cause: the bundle's export form. Claude rebuilt the lib with a literal `export default async function handler` (build.sh rev 2, verified locally) and wrote BANKR-HANDOFF rev 3 (logs plus redeploy). Spent so far: $0.003 (T1, T2×2). The owner continues with the T4+ probe cases while the lib is redeployed.
- **2026-10-08:** T2 re-run passed: Bun 1.3.14 on arm64, about 60 MB RSS, outbound fetch OK. **`x-402-payer` header present** (good for paying-wallet metrics). `x-forwarded-for` present (never log it). 3 paid calls used. Next: T3.
- **2026-10-08:** T2 returned 200 (Bun 1.3.14), but the client's 600-char body cap (Claude's bug) cut off the key fields. Claude raised the cap to 20 KB; T2 will be re-run (+$0.001, within budget).
- **2026-10-08:** **Owner approved paying `0x8AEE…` (BankrFeeRouterV2 per Bankr). T1 passed:** 200, payer −0.001, payout wallet **+0.001 (full, no fee)**, verified by balance reads. No receipt header was returned. Next: T2.
- **2026-10-08:** **T0 run by the owner.** The 402 is valid, but **payTo = `0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0` (a shared Bankr collector, inferred), not the payout wallet.** The client would refuse to sign, as designed. Claude recorded balance baselines (payout 0.121661, collector 1.3718 USDC) and added an opt-in `T001_PAYTO` override. **T-001 is paused for the owner's decision.** Side notes: the owner's `bankr login` created a CLI API key on their Mac (fine; revocable). The accidental `bankr x402 deploy` did nothing (wrong directory). The bun.lock warning is harmless (older Bun).
- **2026-10-08:** Rev-4 endpoints live: `breakra-t001-probe` (GET+POST) and `breakra-t001-lib` (GET), both v1 at $0.001 on Base. Claude verified them via the public schema API. **The owner may now run T0, then the next cases one at a time.**
- **2026-10-08:** T-001 first results:
  - **Burner wallet:** `0x250265e8…7a75`, funded with 0.04 USDC (verified).
  - **Free probe:** Bankr rejected price 0 (minimum $0.000001).
  - **Fee:** 5% (500 bps), reported by Bankr.
  - **Probe:** failed to build twice with the npm dependency.

  **Claude's response:**
  - Split the probe: the dependency-free probe plus `breakra-t001-lib`, pre-bundled via `build.sh`.
  - Wrote `BANKR-HANDOFF.md` rev 2, which asks for build logs and redeploys both.
  - Recorded results in AUDIT §16, TESTING, D-022.

  The owner must still **not** run T0+ until the new deploys are confirmed.
- **2026-10-08:** **Owner approved T-001 execution ("approve and go", D-021).** Claude wrote `BANKR-HANDOFF.md` with the exact deploy request for Bankr's agent. Next: Bankr deploys, the owner sets up the burner and runs the cases, and Claude records the results.
- **2026-10-08:** Owner gave the payout wallet `0xb98f0de777eea8c481b64e33d3e0066cea38fa91` and the payer source, Rabby `0x9E8415109A718de3A4653e4DA37C5906df7C719D`. Bankr's agent answered the §2 questions: it says failures are charged, price 0 isn't supported, and upto $0, the body limit and the fee are undocumented.
  - **T001 client:** Claude wrote `experiments/t001-bankr-probe/client/t001.ts`. It uses the official x402 SDK and runs on the owner's machine with a burner wallet funded from Rabby. It validates the requirements before signing, signs once per call, never auto-retries, caps at 30 attempts and supports the replay test. Verified against a local mock.
  - **SDK finding:** `@x402/fetch` can auto-retry with a fresh payment, a double-charge risk for callers.
  - **Updated:** T-001-PLAN rev 3, AUDIT §15 addendum. Nothing deployed or spent.
- **2026-10-08:** Owner asked why PayBox. Claude explained it was only the session's connected wallet, that the endpoint host is blocked from here, and that the payer should differ from the payee. Claude offered alternatives. **Owner decided Bankr (its agent) will host and deploy.**
- **2026-10-08:** Received input #4, the Bankr agent's brief. Cross-checked it in AUDIT §15. Results:
  - **Direct conflict:** the brief says handler errors are charged, but Bankr's docs say payment is only collected on success. T-001 decides.
  - **Verified wrong:** `api-smart-diff ^3.0.0` (the latest is 1.0.6), a `diffSpecs` export (it doesn't exist), and the `x402 logs` and `x402 update` CLI commands.
  - **New and useful:** a 30 s hard timeout, one URL per deployment, and the `x-402-payer` header.
  - **Changes:** rewrote `T-001-PLAN.md` (rev 2); probe sleep is now capped at 25 s.
  - Nothing deployed or spent.
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

---

## Appendix D — Bankr agent technical brief (input #4)

*(Received 2026-10-08 from the owner and written by Bankr's agent. Saved verbatim. **Several claims are verified wrong or conflict with Bankr's docs. See AUDIT.md §15 before relying on any of it.**)*

> Here's a complete, grounded technical brief for Breakra on Bankr x402 Cloud. Everything below is confirmed from the platform's actual capabilities — I'll flag anything that's unconfirmed or undocumented.

### 1. Runtime and Deployment

**Runtime**: Bun (Amazon Linux 2023, aarch64). The sandbox shims `node`/`npm`/`npx` to Bun, so most Node-compatible TypeScript runs without changes.

**Handler interface** — exact required export:

```ts
export default async function handler(
  req: Request,
  ctx?: BankrX402Context,
): Promise<Response> {
  return Response.json({ ok: true });
}
```

The file must be a single self-contained TypeScript module (`x402/<name>/index.ts`). No local imports outside declared `dependencies`.

**Third-party npm dependencies**: yes, fully supported. Declare them in the `dependencies` array of the deploy payload with exact or semver-pinned versions. Published npm packages only — no git URLs, GitHub shorthand, file refs, or workspace links. `api-smart-diff` is a published npm package and will work.

**Known limits**:
- Execution timeout: **30 seconds hard cap** (AWS HTTP API Gateway — cannot be raised)
- Bundle size, memory, CPU, concurrency: not publicly documented with exact numbers. The platform is Lambda-backed; assume standard Lambda constraints (~128–512 MB RAM, ephemeral `/tmp` only for in-process use)
- No persistent filesystem between invocations unless you opt into `fileAccess` (see §4)

**CLI deployment**: yes. The agent tool (`deploy_x402_endpoint`) and the CLI share the same server-side builder/deployer. You can deploy from source directly — no Docker, no DNS, no infra. The CLI command is `bankr x402 deploy` from your project folder.

**Updates / versioning**: redeploying the same `name` bumps the version in-place. The platform archives source on every successful deploy. There is no built-in rollback to a prior version via UI — you'd redeploy the prior source manually.

**Logs**: yes. `get_x402_endpoint({ name, include: ["logs"] })` returns recent request logs and errors. Also accessible via the x402 dashboard.

### 2. API Requests and Responses

**Request body size**: not publicly documented with an exact byte limit. AWS API Gateway's default is **10 MB** — treat that as the practical ceiling. For OpenAPI spec comparison, multi-megabyte payloads are likely fine in practice, but this is not a confirmed platform guarantee.

**POST and custom paths**: yes. You declare `methods: ["POST"]` in the deploy payload. Each deployment is a single endpoint at `https://x402.bankr.bot/<wallet>/<name>`. The path is fixed to that URL — you cannot expose multiple sub-routes (e.g. `/v1/analyze` and `/v1/health`) from one deployment. Each route = one deployment.

**HTTP status codes / headers / response bodies**: fully under your control. Return any `Response` object — `Response.json(...)`, custom headers, any status code.

**Content-type restrictions**: none enforced by the platform. Parse `await req.json()` yourself and return 400 on parse failure.

**CORS**: not handled automatically. Add `Access-Control-Allow-Origin` headers in your handler if needed.

**Multiple routes per deployment**: not supported. One deployment = one paid endpoint URL. For Breakra's `POST /v1/analyze`, deploy one endpoint named e.g. `breakra-analyze`.

### 3. x402 Payments — Full Lifecycle

**Payment scheme**: `exact` (default). The client pays the fixed price before the handler runs. The handler only executes after payment is verified on-chain.

**x402 version**: the platform implements the x402 protocol. Exact version string is not publicly documented.

**Base mainnet USDC**: yes, confirmed. Payments settle in USDC on Base.

**Lifecycle**: Client sends POST → platform issues HTTP 402 with payment details → client signs and submits USDC payment on Base → platform verifies payment on-chain → handler executes → handler returns Response → platform forwards response to client → USDC settles to deploying wallet

**Failure scenarios**:

| Scenario | What happens |
|---|---|
| Handler returns 400 / 422 | Payment already settled. Client paid; got an error response. No refund. |
| Handler returns 500 | Payment already settled. Client paid; got a 500. No refund. |
| Handler throws / unhandled exception | Payment already settled. Platform returns 500 to client. No refund. |
| Handler times out (>30s) | Payment already settled. Client gets 503. No refund. |
| Payment fails / client doesn't pay | Handler never runs. No charge. |

**Important**: the handler runs only after payment is confirmed. But once payment is confirmed, the client bears the risk of handler errors. Design Breakra to be robust — validate inputs before doing expensive work, return 400 early for malformed specs.

**Double-charge / retry protection**: the x402 protocol includes payment receipts that prevent replay. A valid payment receipt cannot be reused for a second request. Idempotency at the application layer (same spec pair submitted twice) is your responsibility — the platform does not deduplicate by request body content.

**Price configuration**: `$0.02 USDC` is fully supported. Set `price: "0.02"` (string, not float). Minimum price: `$0.001` USDC (confirmed — this is the deploy default).

**Fees and payouts**: Bankr charges a platform fee per successful request. The exact fee percentage is not publicly documented in the authoring directive — I won't guess a number. Revenue goes to the wallet that deployed the endpoint (your connected wallet: `0xb98f0de...`). Payout wallet is the deploying wallet; changing it requires redeploying from a different wallet. Settlement timing is not publicly documented with exact block/time guarantees.

### 4. Security and Operational Limits

**Request-size / execution limits**: enforced by the platform (API Gateway + Lambda layer). You don't need to implement your own timeout logic.

**Rate limiting / abuse protection**: not publicly documented. No confirmed per-endpoint rate limiting beyond what Lambda concurrency provides.

**Environment variables / secrets**: yes. Declare names in `requiredEnvVars`; set values in Terminal Settings → Env Vars → x402 endpoints (or `bankr x402 env set KEY=value`). Values are injected as `process.env.KEY` at runtime. Values are never exposed to the agent or in logs. Breakra doesn't need external API keys, so this is a non-issue for your use case.

**Outbound network access**: yes, allowed. `fetch()` works from handlers. Breakra doesn't need it (pure computation), but it's available.

**Filesystem / persistent storage**: ephemeral `/tmp` only between invocations. For persistent state, opt into `fileAccess` (private file store) or `appKVAccess` (companion app KV). Breakra is stateless, so neither is needed.

**Concurrent request isolation**: each invocation is an isolated Lambda execution. No shared in-process state between concurrent requests.

**Malformed JSON**: handle it yourself — `await req.json()` throws on bad JSON; wrap in try/catch and return 400. The platform does not pre-validate request bodies.

**Restricting HTTP methods**: yes. Set `methods: ["POST"]` in the deploy payload. The platform rejects other methods before the handler runs.

### 5. Developer Experience and Discovery

**Testing before production**: deploy a separate endpoint with a different name (e.g. `breakra-analyze-test`) at `$0.001` price. There is no sandbox or Base Sepolia test environment — all deployments are on Base mainnet. Test endpoints are real paid endpoints at minimum price.

**Disposable test endpoint at $0.001**: yes, confirmed. That's the minimum price and the deploy default.

**Agent discovery**: yes. Endpoints are listed in the Bankr x402 marketplace at `https://bankr.bot`. Agents can discover via `discover_x402_endpoints` (semantic search) and call via `call_x402_endpoint` with automatic payment. The endpoint URL itself (`https://x402.bankr.bot/<wallet>/<name>`) is machine-callable without visiting any website — agents probe it, receive the 402 with payment details, pay, and get the response.

**API documentation / schema**: publish via the `schema` field in the deploy payload (JSON Schema for input/output) and the `description` field. No separate docs hosting — the schema is embedded in the endpoint's marketplace listing.

**Discovery without a website**: confirmed. The x402 protocol is self-describing — a GET/HEAD to the endpoint URL returns the 402 with price, payment token, and network. Agents can discover and invoke autonomously.

### 6. Costs, Analytics, and Payouts

**Platform fee**: charged per successful request. Exact percentage not publicly documented — I won't fabricate a number.

**Free allowances**: none confirmed.

**Failed executions billed**: no — if the handler never runs (payment failed), no charge. If the handler runs and errors, the client paid but you still receive the revenue (minus platform fee). The platform does not refund on handler errors.

**Network transaction fees**: Bankr covers gas for payment settlement — clients don't pay separate gas on top of the USDC price.

**Revenue wallet**: the wallet that deployed the endpoint (`0xb98f0de...` in your case).

**Analytics**: `get_x402_endpoint({ name, include: ["details"] })` returns 30-day revenue and aggregate request metrics. Logs via `include: ["logs"]`. Detailed per-call analytics (unique wallets, repeat usage, per-request breakdown) — not confirmed as available beyond what the dashboard shows.

**Data export**: not confirmed as a platform feature.

### 7. Compatibility Assessment for Breakra

**Verdict: fully compatible, no blockers.**

| Requirement | Status |
|---|---|
| TypeScript handler | confirmed |
| POST endpoint | confirmed |
| JSON request/response | confirmed |
| `api-smart-diff` npm dependency | confirmed (published npm package) |
| No database / frontend / external API | confirmed (stateless = simplest pattern) |
| $0.02 USDC price | confirmed |
| Agent-discoverable | confirmed |
| No persistent storage needed | confirmed |

**One risk to design around**: the 30-second hard timeout. If `api-smart-diff` runs slowly on very large OpenAPI specs (thousands of paths, deeply nested schemas), you could hit the wall. Validate and size-cap inputs early. Consider returning 413 for payloads above a safe threshold before doing the diff.

### Minimal Working Handler (as provided; ⚠️ does not work, see AUDIT §15)

```ts
import { diffSpecs } from "api-smart-diff";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { before?: unknown; after?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { before, after } = body;
  if (!before || !after || typeof before !== "object" || typeof after !== "object") {
    return Response.json(
      { error: "body must contain 'before' and 'after' OpenAPI 3.0 objects" },
      { status: 422 },
    );
  }

  let result: unknown;
  try {
    result = diffSpecs(before, after, { format: "openapi3" });
  } catch (err) {
    return Response.json(
      { error: "diff failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 422 },
    );
  }

  return Response.json({ ok: true, diff: result });
}
```

### Deploy Payload (as provided)

```json
{
  "name": "breakra-analyze",
  "description": "Compare two OpenAPI 3.0 specs and return breaking-change analysis. $0.02 USDC per call.",
  "price": "0.02",
  "methods": ["POST"],
  "tags": ["openapi", "api-diff", "breaking-changes", "developer-tools"],
  "dependencies": [
    { "name": "api-smart-diff", "version": "^3.0.0" }
  ],
  "schema": {
    "input": {
      "type": "object",
      "properties": [
        { "name": "before", "schema": { "type": "object", "description": "OpenAPI 3.0 spec (before)" } },
        { "name": "after",  "schema": { "type": "object", "description": "OpenAPI 3.0 spec (after)"  } }
      ],
      "required": ["before", "after"]
    },
    "output": {
      "type": "object",
      "properties": [
        { "name": "ok",   "schema": { "type": "boolean" } },
        { "name": "diff", "schema": { "type": "object", "description": "Structured diff with breaking-change classifications" } }
      ]
    }
  }
}
```

### CLI Commands (as provided)

```bash
npm install -g @bankr/cli
bankr login
bankr x402 deploy
bankr x402 env set MY_KEY=value
bankr x402 logs breakra-analyze          # ⚠️ not in CLI 0.3.45
bankr x402 update breakra-analyze --price 0.03   # ⚠️ not in CLI 0.3.45
bankr x402 pause breakra-analyze
bankr x402 resume breakra-analyze
bankr x402 delete breakra-analyze
```

> Note: CLI package name (`@bankr/cli`) and exact subcommand syntax — verify against the official docs below, as I'm grounding this on the authoring directive's description of the CLI model, not a live CLI reference.

### Example x402 Payment Flow (as provided)

Step 1: `POST https://x402.bankr.bot/0xb98f0de.../breakra-analyze` → HTTP 402, `x-payment-required: { "amount": "0.02", "token": "USDC", "network": "base", ... }`
Step 2: client signs and submits USDC payment on Base, receives receipt.
Step 3: client retries with `x-payment: <signed receipt>` and the JSON body → HTTP 200 `{ "ok": true, "diff": {...} }`.

The payer wallet is available in your handler via `req.headers.get("x-402-payer")` — router-set, spoof-proof, useful for per-wallet quotas or audit logs.

### Official Documentation (as provided)
- Platform: `https://bankr.bot`
- x402 endpoints dashboard: `https://bankr.bot/terminal` (x402 section)
- x402 protocol spec: `https://x402.org`

### Commonly Overlooked Limits (as provided)
1. **30-second hard timeout**: no exceptions, no config. Diffs that take more than 30 s will 503 the client after they've already paid. Add an input size cap.
2. **One URL per deployment**: no sub-routing. `/v1/analyze` is not a real path; the endpoint is at `/<wallet>/breakra-analyze`.
3. **Handler errors don't refund**: a 500 or exception after payment verification means the client paid and got nothing.
4. **No rollback**: redeploying overwrites. Keep your source in version control.
5. **x402 env vars are a separate scope** from agent/tool env vars. Use `bankr x402 env set` or the x402 dashboard.
6. **Platform fee is taken from revenue**: net per call is less than $0.02.
7. **`api-smart-diff` version**: pin the exact version you tested against.

### 2026-11-20: website v2 part 1 built (awaiting owner screenshot approval)
- New `site/index.html`: 1Claw-style header (Product / Developers / More menus, Pricing, GitHub, Get started, theme toggle), hero with two copy boxes, "See it work" tabs generated from six curated benchmark cases by `scripts/site-demo.ts`, before/after, use cases, benchmark proof (numbers tested against `benchmark/results.json`), For AI agents, pricing, FAQ, column footer with "Listed on" and "Built by SOMEHOW". New `site/llms.txt`. Light theme optional; dark default.
- `site/app.js`: menus (outside click / Escape), ARIA tabs, theme toggle (localStorage in try/catch), copy buttons. Still no inline script or style; CSP unchanged.
- Tests: `tests/site.test.ts` adds demo = engine output, benchmark numbers, llms.txt, roadmap labels. `bun run check` passes (200 tests, smoke, npm smoke).
- Screenshots (1440 px and 390 px, dark and light) sent to the owner. No PR until approved.

### 2026-11-20: website v2 part 2a built (awaiting owner screenshot approval)
- Owner merged PR #40 (part 1; live on breakra.dev, verified by fetching the page and /llms.txt) and approved part 2a.
- New pages: `/integrations` (Claude Code, MCP clients, skill, a GitHub Actions workflow dry-run locally, scripts, x402, stable contract), `/benchmark` (tables generated from `benchmark/results.json`), `/security` (data flow, input limits tested against `LIMITS`, payments, supply chain, scanner fixes, reporting), `/compare` (Breakra vs oasdiff, incl. where oasdiff is stronger and the documented disagreements).
- `scripts/site-pages.ts` copies the homepage header and footer (marker blocks) into every page; tests fail if any page drifts, if an internal link points to a missing file, or if the sitemap misses a page. Header/footer links now point to the new pages.
- `bun run check` passes (205 tests, smoke, npm smoke). No PR until the owner approves the screenshots.

### 2026-11-20: website v2 part 2b built, with the official logo (awaiting owner screenshot approval)
- Owner merged PR #41 (CodeQL fixed by replacing a regex tag-strip in a test) and supplied the official logo (two raster images) with "start part 2b".
- Logo: traced to vector with potrace (pure-Python port, scratch virtualenv, not a repo dependency); compared side by side with the originals. `site/logo/`: logo and mark, SVG + transparent PNG, black and off-white. Inline in the header and footer (follows the theme); new favicon from the mark. Tests tie the inline logo and favicon to the published files.
- New pages: `/pricing`, `/about`, `/contact` (email + GitHub, no forms), `/brand` (logo, downloads, colours, type, descriptions), `/blog` (releases and updates from tags and CHANGELOG). Header/footer links point to them; sitemap lists all 10 URLs.
- Not changed: README graphics, `og.png` and docs/assets still use the old text wordmark (follow-up).
- `bun run check` passes (206 tests, smoke, npm smoke).

### 2026-11-20: README graphics and og.png use the official logo (awaiting owner approval)
- Owner merged PR #42 and asked to update the README and og.png with the logo.
- `docs/assets/hero.svg`, `how-it-works.svg` and `social-preview.svg`: the typed "breakra" wordmark (and its underline bar) is replaced by the logo paths from `site/logo/`. The social preview also says "OpenAPI 3.0/3.1" (it said 3.0 only).
- `site/og.png` and `docs/assets/social-preview.png` re-rendered from the SVG (identical files). Test added: the three graphics carry the published logo path.
- Owner action after merge: re-upload `docs/assets/social-preview.png` in GitHub Settings → General → Social preview. Not changed: `x-launch.*` and `x-demo.png` (historical launch-post images).

### 2026-11-20: GitHub Actions example (developer assets, step 1)
- Owner merged PR #43 and uploaded the social preview; live site verified (og.png identical to main, logo, all new pages 200). Owner approved the next task.
- `examples/github-actions/breakra.yml` + README: compares the PR's contract with the base branch using `npx -y breakra@0.2.2`, `SPEC`/`FAIL_ON` settings, skips new contracts, read-only permissions, base ref passed via env.
- `tests/examples.test.ts` runs the workflow's script in a temporary git repo: breaking → 1, compatible → 0, new contract → skip, `FAIL_ON: review` → 1 on a new required parameter, unreadable → 2; pinned version must equal package.json; the /integrations page must show the exact file.
- `bun run check` passes (214 tests, smoke, npm smoke). Not run inside GitHub Actions itself.

### 2026-11-20: partner proof kits (Bankr, Aeon), owner-approved plan
- Owner merged PR #44, approved the plan: Bankr two-message proof via x402; Aeon community pack **inside the breakra repo**; Aeon test in a **new owner-created repo** (fresh copy of upstream; not the existing fork, which is 5 weeks behind and runs a CORTX skill).
- Research: Bankr installs skills from any public GitHub repo (root SKILL.md), agents pay x402 natively under wallet spend limits, sandbox can install npm packages. Aeon (aeonfun/aeon @ 8c0bbab): community packs via `install-skill` / `bin/install-skill-pack --path`, read-only skills may run npx/curl/notify.
- Built `integrations/`: shared fixtures + expected results (`scripts/integration-kits.ts`; analysis_id identical for YAML text, JSON text, objects), Bankr kit (README with the two messages, DEMO, FINDINGS template), Aeon pack (manifest, `breakra-check` SKILL.md, fixtures, README, DEMO, FINDINGS with local pre-checks). `tests/integrations.test.ts`.
- Local Aeon pre-checks all pass (validator, scan, installer dry run and real install in a scratch copy, category check, demo commands with the published package: ids match). Friction found: installer doesn't update `eyebrowlock.json`, so the install PR fails Aeon's skill-integrity CI (affects every community pack).
- Owner next: create the Aeon test repo; run the Bankr test (authorize ≤ $0.06); share transcripts.

### 2026-11-20: Bankr proof verified
- Owner merged PR #45, ran the Bankr test in their account: skill installed from GitHub (message 1); message 2 → 2 paid hosted checks at $0.02 each ($0.04 total, owner-authorized). Change 1 `block`/major and change 2 `safe`/minor, both `analysis_id`s identical to `integrations/fixtures/*/expected.json`. Recorded in `integrations/bankr/FINDINGS.md`. No friction reported; recording pending. Aeon test still pending.

### 2026-11-20: Aeon proof verified
- Owner created `danbuildss/aeon-breakra-test` (template copy of aeonfun/aeon), added `CLAUDE_CODE_OAUTH_TOKEN` (first attempt had a line break), merged the install PR #6.
- `install-skill` is blocked in Actions (allowlist lacks `bin/install-skill-pack`); installed via the documented local-clone fallback (PR #6). Fixed icon + packs.json by hand; integrity lock and docs-parity checks left red (Aeon-side).
- `breakra-check` demo run #2: BLOCK (major) and SAFE (minor), both `analysis_id`s identical to `expected.json` (and to the Bankr run). Recorded in `integrations/aeon/FINDINGS.md` with five Aeon install-path gaps for their maintainers.

### 2026-11-22: $BRKR launch material, D-042
- Owner is launching $BRKR on Base via Bankr; approved D-042 (optional token, separate from the product, not on breakra.dev/README/SKILL/package; disclaimers; no partner endorsement claims; Claude never handles keys, trades or deployment).
- Approved launch creative: accent option B (one red-orange accent, BLOCK only), the token as an end-card line only, square + 16:9 video and three cards. Built outside the repo with Playwright + ffmpeg; sound effects from earshot 1.0.0 (MIT, public-domain-learned designs) in a scratch environment.

### 2026-11-22: positioning update (D-043)
- Owner adopted the primary tagline "The API safety layer for developers and AI agents." Applied to site (homepage title, hero, lede, footer, FAQ "Is Breakra a security scanner?", About, Brand, llms.txt), README (banner, intro, vision, scope note), VISION.md, SKILL.md title, package.json, server.json, CLI usage, Bankr listing text, openapi.json intro, hero.svg, social preview + og.png.
- Owner actions: redeploy Bankr (listing text), next MCP Registry publish (server.json), re-upload the GitHub social preview.
- Also delivered earlier today, outside the repo (D-042): the $BRKR launch video (square + wide; lo-fi bed; the owner's voice-over, 31 s) and three cards.
- **2026-11-22:** Owner merged #49 and #50 (positioning + subline), redeployed Bankr **v8** from a fresh clone of `main` (219 tests, smoke, npm smoke OK); V0 pass, terms unchanged, listing description shows the new tagline. Owner to confirm the handler checksum (`954dcd97…bdbeb`); GitHub About text and social preview to update by hand.
- **2026-11-22:** Website motion + works-with row + tabs (D-044). Proofs: Claude Code `claude mcp list` Connected; MCP Inspector 2.16.0 tools/list + tools/call (block, `…09cb39`; the Inspector's stripped env needed this sandbox's proxy passed through); GitHub Actions real run on PR #52 (safe; first run exposed npx resolving Breakra's own unbuilt package inside its repo, fixed by running from `$RUNNER_TEMP`). Handler checksum for Bankr v8 confirmed by the owner (`954dcd97…bdbeb`).
- **2026-11-22:** Orric (D-045): homepage Products section (Breakra Core live, Orric private preview), Product-menu and footer entries, `/orric` page (owl mascot, status, mission, how it works, principles, built-on-Breakra, follow links), sitemap and llms.txt. Owner says Orric runs privately; the site shows no findings, numbers, activity or signup. Tests enforce the status labels, no forms, and security mentioned only as out of scope.
- **2026-11-22:** Status page, About products, analytics (D-046): `scripts/status-check.mjs` + `.github/workflows/status.yml` (every 15 min, results to the `status` branch, unpaid x402 checks verify the approved terms), `/status` page + `status.js` (shows only stored data; "No checks recorded yet" before the first run), `/status`-only CSP exception, Vercel Web Analytics + Speed Insights on every page (owner enables them in Vercel), About "What we build". Local check run: all OK except the direct Bankr URL and npm downloads, which this sandbox blocks; GitHub runners should reach them (unverified until the first real run).
- **2026-11-22:** Owner merged #55 and ran the status workflow: first real run 6/6 OK; npm downloads 453 confirmed against npmjs.com by the owner. Uptime now shows the number of checks until a week of data exists (owner approved).
- **2026-11-22:** No scheduled status runs in 2 h after the merge (workflow active, cron valid). Owner approved moving the cron to `7,22,37,52 * * * *` (re-registers the schedule, avoids busy minutes).

### 2026-11-25: official GitHub Action (D-047)
- Owner approved the co-founder plan (focus on repeat usage via CI) and the action plan; created `danbuildss/breakra-action`, made it public, merged #1 and #2, published `v1.0.0` on the Marketplace.
- Status schedule: GitHub started scheduled runs on its own overnight (02:40 and 11:22 UTC on 2026-11-23) but rarely; owner is setting up cron-job.org (option 2). Test-run result not yet reported.
- Action: 11/11 tests; real run on throwaway PR #58 (closed): REVIEW comment, failed check, analysis_id matched locally. Found that only a removed operation is BLOCK; action README says so. Default `fail-on` still `block` pending owner decision. `v1` tag not created (this session's tag push got 403).
- Main repo: contract-check.yml uses the action; new `examples/github-actions/breakra-action.yml`; Integrations page and homepage CI tab lead with the action; plain workflow kept.
- **2026-11-25:** Owner released breakra-action v1.1.0 (fail-on defaults to review) and moved `v1`; Breakra now pins v1.1.0. Added the private Orric desk (D-048) from Orric's handoff; tested locally under the production headers (no key: sign-in only, 0 API calls; wrong key: error; valid feed: dashboard; no CSP errors; no horizontal scroll at 1280 and 390).
- **2026-11-27:** Owner approved review action #2, Part A (D-049): local limits profile (25 MB/file, 2M nodes, 20k operations, 5M expanded) for CLI/MCP/Action; hosted unchanged. Measured: GitHub full spec 7.2 s / 400 MB locally; Stripe 1.3e12 expanded nodes (26 s, 4.3 GB, 280k duplicated changes) so it stays refused; Part B (report shared-schema changes once) proposed separately. Grant deck (12 slides, $10,000, private artifact) delivered; Bankr PR #771 re-reviewed with no blockers (not yet merged); reply drafted for the owner.
- **2026-11-27:** Owner merged #61 (D-049). Release 0.3.0 prepared: package, CLI version, server.json, pinned commands in README/SKILL.md/examples/site/partner kits (FINDINGS records stay 0.2.2), CHANGELOG 0.3.0 section. Owner to publish via the manual workflow, tag v0.3.0, publish the MCP Registry entry; then bump the action default.
- **2026-11-27:** 0.3.0 fully released: npm (provenance, trusted publishing now set up), MCP Registry 0.3.0 active/latest, GitHub Release v0.3.0, breakra-action v1.2.0 (runs 0.3.0, v1 moved; a stray v0.3.0 tag on breakra-action was removed). Review action #3: all workflow actions pinned to commit SHAs (Dependabot keeps them current); dev-only @x402/core and @x402/evm 2.28.0 -> 2.32.0, which moves zod to 4.6.6 and clears the bun audit finding (nothing shipped changes).
- **2026-11-27:** #63 merged. Review #4 (clearer local errors): `src/hints.ts` (syntax location via the `yaml` library on failure only, next-step hints per code, `--json` error body with `hint`), file errors with path and reason, invalid-spec pointer, `--use` wording; MCP errors get the hint. Hosted handler unchanged (95,039 bytes). 12 new tests, including a no-content-echo check. Permission-denied path not exercised (sandbox runs as root).
- **2026-11-27:** Review #5 (site tests): most site assertions guard facts (price, limits, versions, headers, honest labels) and stay; removed only implementation pins (a code comment in boot.js, the status uptime-label code). That audit found the header menu (all pages) still tagging the shipped GitHub Action "roadmap" and About saying "A GitHub Action (roadmap)"; both fixed, and the test now asserts the opposite.
- **2026-11-27:** #66 merged (clearer errors, site Action label; CodeQL js/file-system-race fixed with a single open handle). Release 0.3.1 prepared (versions, pins, CHANGELOG 0.3.1); owner publishes via the workflow, MCP Registry, tag v0.3.1, then the action default.
- **2026-11-27:** 0.3.1 fully released (npm, MCP Registry 0.3.1 latest, GitHub Release v0.3.1, breakra-action v1.3.0 with v1 moved). Follow-up: our own contract check, examples and site point at breakra-action@v1.3.0. Tweet images (release card with the real PR comment; Orric card with verified counter 17/30/6/0) and a Show HN draft delivered to the owner.
- **2026-11-27:** D-050 PR 1: Orric #14 false SAFE fixed (`enum_introduced`, plus the mirror `enum_removed`), #1 OpenAPI 3.1.2 accepted. All 6 Orric issues reproduced on 0.3.1 first. Version bump and regenerated outputs deferred to one release PR after PR 3 so docs never claim an unreleased engine (owner to redeploy Bankr then).
- **2026-11-27:** #69 merged. D-050 PR 2: Orric #3/#4 (nested example and x-* are documentation; a property named x-… stays contract) and #2 (leaf $ref options of anyOf/oneOf inlined before diffing; recursive targets untouched). New `docs/project/ORRIC-FIXES.md` records each fix for the owner's "Orric found it, we fixed it" post.
- **2026-11-27:** #70 merged. D-050 PR 3: Orric #16 (WorkOS `GET /events`, ~2 min). Measured: all the time is in api-smart-diff matching the options of a changed union pairwise (classify 8 ms); 138-option union unchanged 1.5 s, one option edited 5 s, WorkOS 120 s. Fix: `checkChangedUnions` refuses a `oneOf`/`anyOf` over 24 options (hosted) / 64 (local) with options both replaced and added; WorkOS refused in <0.1 s, GitHub demo (22 → 35, additions only) and GitHub full spec (7 s) unaffected. Also fixed two PR 2 curated cases that expected a docs-only rule the benchmark filters out (benchmark 21/21). README/SKILL/API limit text goes in the release PR.
- **2026-11-27:** #71 merged. Release PR for D-050: engine/rule set 0.3.0, package 0.4.0, all generated outputs regenerated (demo: same 59 changes, new id `…1a3477`; Bankr kit ids `…63c51f` / `…3ffecc`), 3.1.2 and the union limit in the docs, benchmark 21/21. Reason strings now use RULE_SET_VERSION. Found the benchmark's GitHub 18→19 rulesets over-report fixed by PR 2 (12 findings → 0, checked against npx breakra@0.3.1). Owner next: publish 0.4.0, Registry, tag, Bankr v9, Action default; then Orric re-run.
- **2026-11-27:** 0.4.0 released: npm 0.4.0 (checked from the registry: engine 0.3.0, kit ids match, WorkOS refused in <1 s, 3.1.2 accepted), MCP Registry 0.4.0 latest, tag v0.4.0, breakra-action v1.4.0 (default 0.4.0, fixtures regenerated, 13/13) with v1 moved. Follow-up: own contract check, examples and site use breakra-action@v1.4.0. Remaining: GitHub Release v0.4.0, Bankr v9, then the Orric re-run.

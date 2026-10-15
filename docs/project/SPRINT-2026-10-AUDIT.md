# Breakra — Sprint Audit and Four-Week Plan (Oct 16 – Nov 12, 2026)

**Status:** DRAFT for owner approval (written 2026-10-15, day 7 of the 14-day experiment; updated the same day with feedback, a metrics-attribution review, the Vercel terms, safety issues, market research and the Week 1 board). Nothing in this document is approved, built, deployed or spent.
**Scope rule:** Breakra stays an independent product: its own brand, repo, strategy and commercial records, separate from CORTX and Somehow (D-019).
**Evidence labels:** **[verified]** = checked by Claude in this session from code, tests, CI or GitHub. **[recorded]** = written in the project log from an earlier session or owner output, not re-checked today. **[owner to verify]** = Claude can't reach it from the sandbox. **[hypothesis]** = inference, not evidence.

---

## 1. Product audit

### 1.1 Release and production deployment
| Item | State | Evidence |
|---|---|---|
| Release | **v0.1.1**, published 2026-10-09 08:29 UTC | [verified] GitHub Releases: https://github.com/danbuildss/breakra/releases/tag/v0.1.1 |
| `main` | `458d6ee` (PR #23). No open PRs, no open issues | [verified] GitHub |
| Engine / rules | engine 0.1.1, rule set 0.1.0, api-smart-diff 1.0.6 pinned | [verified] `src/version.ts`, `package.json` |
| Bankr deployment | v4 of `breakra-analyze`, built from engine 0.1.1 | [recorded] owner deploy output 2026-10-08/09. **[owner to verify]** today |
| Forward | `breakra.dev/api/analyze` → Bankr (Vercel rewrite, D-038) | [recorded] paid V4 through the forward returned 200 with the matching `analysis_id` on 2026-10-09 |
| Built handler | 90,997 bytes; smoke test passes (200 / 400 / 405) | [verified] `bun run check` today |

**Step 1, free live check, PASSED (owner's run, 2026-10-15 20:44 UTC; Claude decoded the `payment-required` header):**
- `breakra.dev` `/`, `/skill.md`, `/openapi.json` and `/.well-known/x402` all returned **200**.
- An unpaid POST through **breakra.dev/api/analyze** returned **402** (`server: Vercel`).
- An unpaid POST **directly to Bankr** returned **402** with a body.
- Both carry the same terms: `exact`, `eip155:8453`, USDC `0x8335…2913`, amount **20000**, payTo **`0x8AEE…01a0`** (Bankr router), `maxTimeoutSeconds` 60, facilitator `https://api.bankr.bot/facilitator`.
- Still true: Bankr's 402 has **no `extensions.bazaar`** and **no top-level `resource`**.
- Side note: the forwarded 402 also carries the site's security headers (CSP etc.). That's harmless for API clients.
- **Not covered by this check:** the paid path (step 7, not approved yet) and uptime between checks (no monitoring).

**Earlier note:** From this sandbox every request to breakra.dev, x402.bankr.bot, x402scan and the Base RPCs gets a proxy 403. The last live evidence is from 2026-10-09. The owner should run the check in §11 before any of this is called "live".

### 1.2 What is built and shipped
- **API:** one paid operation, `POST` with `{before, after}` (inline OpenAPI 3.0.0–3.0.4 JSON) → deterministic findings with rule id, operation, location, evidence, reason and recommended action. `analysis_id = sha256(engine, rules, input hashes)`.
- **Errors:** 7 error codes. All 4xx/5xx are free (D-023).
- **Docs:** SKILL.md (agent guide), openapi.json (with x402scan metadata), RULES.md, docs/API.md, docs/DEPLOYMENT.md, examples/ (request, response, paying client, curl), demo/github-rest-api/.
- **Website:** breakra.dev, a static page (D-037) with `/skill.md`, `/openapi.json` and `/.well-known/x402`, plus a strict CSP.
- **Open source:** MIT, CONTRIBUTING, SECURITY, issue templates (including *Report a wrong finding*), PR template.
- **Measurement:** `bun run metrics` (on-chain, read-only; owner runs it).

### 1.3 Endpoint availability and x402 payment behaviour
| Behaviour | Evidence |
|---|---|
| Unpaid request → 402 with terms (exact, `eip155:8453`, USDC, `20000`, payTo = Bankr router `0x8AEE…01a0`, 60 s validity) | [recorded] Phase 3 V1–V6 and 2026-10-09 |
| Paid request → 200, charged once; replayed signature → 402 "Payment already used" | [recorded] T12, V4 |
| Errors are free (4xx never settles) | [recorded] Phase 3; Bankr settles only on 2xx |
| Bankr fee observed | [recorded] 0% so far (burner −0.02, payout +0.02). Bankr reportedly charges 5% above 1,000 requests a month: unverified |
| Bankr's 402 has no `extensions.bazaar` and no top-level `resource` | [recorded] owner's curl, 2026-10-09; the email to Bankr is drafted but **not sent** |
| Uptime or error rate since 2026-10-09 | **unknown**: no monitoring exists (none was approved) |

### 1.4 Determinism, accuracy and known limits
- **Tests:** 103 tests pass across 7 files [verified today]. They cover 38 rule tests, 18 validation tests, handler tests, the bake-off fixture, and docs/site drift.
- **Oracle:** a cross-check against oasdiff v1.33.0 runs in CI. There are 3 documented differences [verified, `tests/oracle-differences.json`].
  - Breakra is deliberately stricter in two places: when authentication is added, and when an optional response property is removed.
- **Real-world check:** the GitHub REST API demo (Dec 2025 → Oct 2026), checked by hand. Checking it found the `$ref` misclassification, which engine 0.1.1 fixed (D-034).
- **Known limits (by design):**
  - OpenAPI 3.0 JSON only: no 3.1, no Swagger 2.0, no YAML, no URL input.
  - Bodies up to 1 MB; at most 75k expanded nodes; at most 500 changes listed.
  - External `$ref`s are never fetched.
  - These are rated `unknown`: callbacks, `discriminator`, `not`, unrecognised keywords, changed `$ref` strings.
- **Performance risk:**
  - Bankr runs about 10× slower than local. The largest accepted pair (940 KB) took **8.1 s of handler time and 17.9 s end to end**, against Bankr's 30 s hard cap [recorded, BENCHMARKS.md].
  - A timeout after payment would be charged and return nothing.
- **Accuracy evidence is internal only.** No outside user has reported a wrong finding, but nobody outside has used it yet either.

### 1.5 CI, security and vulnerabilities
| Check | State |
|---|---|
| CI on `main` | Green on every merge through PR #23 [verified] |
| CodeQL | Green, including the weekly scheduled run on 2026-10-12 [verified] |
| `bun audit` | **No vulnerabilities** in 136 packages [verified today] |
| Outdated deps | Only dev deps (`@types/bun`, `viem`, `vitest`, patch releases). `api-smart-diff` is pinned on purpose |
| Dependabot / code-scanning alert lists | Not readable with Claude's tools. **[owner to verify]** in the repo's Security tab |
| Privacy | Specs aren't logged; library console output is suppressed (D-034) [verified by test] |
| Commercial-use risk | **Vercel Hobby (free) plan terms restrict commercial use** [hypothesis that the project is on Hobby; owner to confirm plan]. breakra.dev forwards a paid API. |

### 1.6 Website, agent docs and discovery metadata
- **Site, SKILL.md and openapi.json:** kept in sync with the code by tests [verified]. The price, limits, URL, error table and example are all checked.
- **openapi.json** (D-038) carries `x-payment-info`, a 402 response, `info.contact`, `info.x-guidance` and `servers: https://breakra.dev`.
- **`/.well-known/x402`** lists `https://breakra.dev/api/analyze`.
- **Gaps:**
  - SKILL.md and the README quick start still lead with the long Bankr URL. breakra.dev isn't the primary URL in the agent guide.
  - There is no one-line install for any agent: no MCP server, no `npx`, no GitHub Action.
  - The README quick start needs a clone plus a funded key file.

### 1.7 Distribution submissions
| Channel | Submitted | Review state |
|---|---|---|
| X launch post | 2026-10-09: https://x.com/danbuildss/status/2108486248004260253 | Reactions **not recorded** |
| X post 2 (demo) | Planned for Oct 10–12 | **Unknown whether it was posted** |
| x402scan | Registered 2026-10-09 (1 resource) | Listed, with a non-blocking warning [recorded] |
| BankrBot/skills | https://github.com/BankrBot/skills/pull/771 | **[owner to verify]**: outside this session's GitHub scope |
| awesome-x402 | https://github.com/xpaysh/awesome-x402/pull/1766 | **[owner to verify]** |
| Email to Bankr (bazaar metadata) | Draft ready | **Not sent** |

### 1.8 Customer feedback and requests
- **Repo:** no issues, no wrong-finding reports and no outside PRs on danbuildss/breakra [verified 2026-10-15].
- **Relayed by the owner on 2026-10-15** (logged in `EXPERIMENT.md`; channels not recorded):

| Who | What | What it is evidence of |
|---|---|---|
| Alex | Make Breakra easier to use as an **installable agent skill** | Install friction (suggestion, not usage) |
| Story91 | Interested in connecting Breakra to **CashBoard**; hit **integration/payment confusion**. Use case **not confirmed** | The only sign so far of a possible integrator, plus a concrete payment-friction report. **No payment from Story91 is confirmed** |
| Noaman | Questioned the website's **minimal colour scheme** | Design feedback on breakra.dev only, **not** evidence the API is unusable |

- **An outside written assessment** (pasted 2026-10-11) suggested a web UI, a GitHub Action, YAML/3.1, more examples, a free preview, consumer context and auto-fix. These are opinions, not usage evidence.
- **Pattern [hypothesis]:** two of the three people describe **getting started** (installing, paying, integrating), not results quality. Nobody has yet reported on findings quality, because nobody outside is confirmed to have received a result.

### 1.9 Revenue, paid calls and external wallets
| Metric | Last known value | Source |
|---|---|---|
| Self-paid Breakra calls | 5 by 2026-10-08 21:44 UTC, plus the V4 check through breakra.dev on 2026-10-09 | [recorded] |
| External paid calls | **0** as of 2026-10-08 21:44 UTC | [recorded] first `bun run metrics` |
| External paid calls since day 1 | **Unknown**: no metrics run has been pasted since launch | — |
| Payout wallet | 267661 (0.267661 USDC), which **includes the owner's other Bankr services** | [recorded] |
| Burner | 184000 (0.184 USDC) | [recorded] |

**Measurement caveat:** see §1.10. On-chain counts can be wrong in specific, checkable ways.

### 1.10 Can the on-chain metrics miscount? [verified by reading `scripts/lib/metrics.ts`]
**How it counts:**
1. It reads every USDC transfer **router → payout wallet** (`0xb98f…fa91`).
2. For each one, it finds the **first** USDC transfer **→ router** in the same transaction and records that sender as the payer and that amount as the gross.
3. A payment counts as Breakra **only if the gross is exactly 20000** ($0.02). All others are reported as "other services".
4. A payer counts as external unless it is one of **3 hard-coded wallets**: the burner, the payout wallet and Rabby.

| Way it could go wrong | Effect | Likelihood / evidence | How we check |
|---|---|---|---|
| **A. Another of your Bankr services is priced at exactly $0.02** (same payout wallet) | Those calls are **counted as Breakra**, and possibly as external | **Unknown today.** On 2026-10-08 all 22 other-service payments had a gross ≠ $0.02, and the 5 Breakra-classed calls matched exactly the 5 known self-tests [recorded, TESTING.md]. On 2026-10-09 the other services added +4000 (not a multiple of 20000) [recorded]. Prices may have changed since | `bankr x402 list`: note every service's price. Breakra's call count must equal `bankr x402 revenue breakra-analyze` for the same window |
| **B. A wallet you control that isn't one of the 3** (e.g. a Bankr agent wallet, another app wallet, a wallet you funded for a friend or tester) | **Counted as external demand**: inflates the scorecard | **Unknown.** Only 3 wallets are excluded in code | You list every wallet you control or funded; I exclude them in the report |
| C. Bankr settles several payments in one transaction | Only the first payer and amount per tx are recorded: **undercount or wrong payer** | Low: EIP-3009 settles one authorization per transfer, and so far 1 call = 1 tx [recorded] | Breakra count vs Bankr's count; any mismatch → inspect the tx hashes |
| D. Bankr changes router, fee model or payout path, or the price changes | Calls are **missed** | Low for the experiment window. A fee would only change net, not gross | Same reconciliation |
| E. Unpaid 402s, free errors, failed settlements | **Invisible on-chain** by design | Certain | Bankr dashboard request counts are the only funnel data |

**Conclusion:**
- The on-chain count is trustworthy **only after** reconciling with Bankr's per-service revenue and checking your wallet list.
- **Revenue separation (your brief):** Breakra's payout wallet also receives your other Bankr services' revenue [recorded]. Commercial records are therefore **not** separated at the wallet level today. Bankr's per-service revenue view is the separating record.
- A dedicated Breakra payout wallet would mean redeploying from a different wallet. That is a decision for you, not part of this sprint unless you approve it.

### 1.11 Vercel plan and commercial use
> **RESOLVED 2026-10-15:** the owner confirmed the Vercel project is on the **Pro** plan [owner-stated]. Pro permits commercial use, so the current deployment (static site plus the `/api/analyze` forward) is compliant. No migration or spend is needed. The analysis below is kept for the record.

- **Vercel's terms [evidence, search results; vercel.com itself was unreachable from Claude's fetch tool]:**
  - The Hobby plan is restricted to **non-commercial personal use**. Commercial use requires Pro or Enterprise.
  - Vercel's examples of commercial use include **"any method of requesting or processing payment from visitors of the site"** and **advertising a product or service**.
  - Sources: [Fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines), [Hobby plan](https://vercel.com/docs/plans/hobby).
- **How that applies to Breakra:**
  - `breakra.dev/api/analyze` answers visitors with an x402 **payment request** (402) and forwards paid requests.
  - The page advertises a paid API.
- **Assessment [hypothesis, high confidence]:** if the project is on **Hobby**, the current deployment very likely **does not comply**. The risk is suspension of breakra.dev, which would take down the discovery URL that x402scan and openapi.json point to. The direct Bankr URL would keep working.
- **Unknown:** which plan the project is on. **Only you can check:** Vercel dashboard → Settings → Billing, or the team name badge ("Hobby" / "Pro").
- **Lowest-cost compliant options that keep the public contract** (`https://breakra.dev/api/analyze`, same 402 terms, same response). Nothing taken; you decide:

| Option | Cash cost | Change needed | Contract kept? | What's verified vs not |
|---|---|---|---|---|
| **A. Netlify Free**: static site + one `_redirects` proxy rule (`/api/analyze → Bankr URL 200`); no code | **$0** (credit-based free tier, 300 credits/mo) | New Netlify site from the same repo; move DNS at Namecheap; port headers/CSP to `_headers` | Yes | Commercial use on Free: **forum staff say yes** ([Netlify answers](https://answers.netlify.com/t/can-we-use-netlify-free-plan-for-commercial-purposes/41545)), but the binding Terms were not read. **Proxy timeout and credit metering for proxied requests: unverified** |
| **B. Vercel Pro** | **$20/month** (1 seat, includes $20 usage credit) ([Vercel Pro](https://docs.vercel.com/docs/plans/pro-plan)) | Upgrade the team; nothing else | Yes | Price from Vercel docs (search summary); compliance certain |
| C. Cloudflare Pages + a small Worker to forward | $0 (100k Worker requests/day free) | **New code** (a Worker) + DNS move | Yes | Commercial terms not found; needs code, so the most change |

**Recommendation:**
1. Confirm the plan first. If it's already Pro, there's nothing to do.
2. If it's Hobby, **A (Netlify Free) is the lowest-cost option**, but only after two free checks:
   - You read Netlify's Terms of Use for commercial use.
   - An unpaid 402 test through a Netlify preview URL returns Bankr's exact `payment-required` header.
3. Then decide on any paid check through it separately.
4. **If either check fails, B ($20/month) is the safe fallback.** At current revenue it costs more than Breakra earns, so it is a deliberate spend for you to approve.
5. Every option is a deployment change: nothing happens without your approval.
- **Related limit:** Vercel's proxied (external-rewrite) request timeout is listed as **30 s** in its limits reference. A newer changelog mentions 120 s for CDN origins. Which applies to external rewrites is **unverified** ([limits](https://vercel.com/docs/limits/overview), [changelog](https://vercel.com/changelog/cdn-origin-timeout-increased-to-two-minutes)).

### 1.12 Immediate production safety issues
| # | Issue | Severity | Evidence | Proposed action (needs approval) |
|---|---|---|---|---|
| S1 | ~~Vercel Hobby commercial-use breach~~ **Resolved: the plan is Pro** (owner, 2026-10-15) | — | §1.11 | None |
| S2 | **Charged without a result on large inputs through the forward.** Bankr settles when the handler returns 200. The 940 KB case took 17.9 s end to end direct [recorded]. Via Vercel there's an extra hop under a possibly-30 s proxy timeout. If Vercel times out but Bankr completes, the caller **pays and gets a 504** | Medium (rare: needs inputs near 1 MB) | Benchmarks + Vercel limits; **not reproduced** | Owner test (paid, needs approval), or document: "for large specs (>500 KB), call the Bankr URL directly" |
| S3 | **No uptime monitoring or alerting.** An outage of Bankr or the forward is invisible until a user complains | Medium | No monitor exists | A free external check of the 402 (no payment, no spec data) — needs approval |
| S4 | **Metrics can overstate external demand** (§1.10 A/B) | Medium (decision quality) | Code review | Reconcile with Bankr; list owner wallets |
| S5 | **Revenue mixed with other services** in one payout wallet | Low (accounting), but conflicts with the separation goal | §1.10 | Use Bankr per-service revenue as the record; dedicated wallet later if wanted |
| S6 | Request bodies (specs) **pass through Vercel's network** on the forward | Low (documented in D-038; Vercel isn't asked to log bodies) | D-038 | None now; keep the direct Bankr URL documented |
| S7 | *(Fixed in the Week 1 safety PR)* The README tells users to run `BREAKRA_KEY_FILE=./wallet.key …` inside a clone, but **`wallet.key` is not git-ignored** [verified]. A user could commit their wallet key | Low (affects users, not production) | `git check-ignore` | One-line `.gitignore` entry (`*.key`) — needs approval |

**No code-level vulnerabilities found:** `bun audit` is clean, CodeQL is green, and secrets are not in the repo (the burner key file is git-ignored [recorded]).

---

## 2. Commercial experiment scorecard (Oct 9 – 22)

**Today: day 7. The scorecard cannot be filled honestly yet:** no post-launch metrics exist in the repo. It closes on Oct 22 with the owner's outputs (§11).

| Measure | Value | How it's measured |
|---|---|---|
| Total paid Breakra calls (all) | _pending_ | `bun run metrics -- --since 2026-10-09` |
| Self-paid calls (burner, payout, Rabby) | _pending_ (≥ 6 known) | same; self wallets listed in code |
| External paid calls | _pending_ (0 at last count) | same |
| Independent external paying wallets | _pending_ | same. **A wallet is not a person** |
| Wallets paying on ≥ 2 UTC days | _pending_ | same |
| Gross revenue (external) | _pending_ (= external calls × $0.02) | on-chain |
| Net revenue | _pending_ | payout-side transfer; cross-check `bankr x402 revenue breakra-analyze` |
| Bankr request count (incl. unpaid 402s, free errors) | _pending_ | Bankr dashboard (the only funnel data we have) |
| Costs (cash) | domain `breakra.dev` (owner's purchase; amount not recorded), test spend ≈ $0.14 over the project, Vercel/GitHub/Bankr hosting $0 [recorded] | owner to confirm the domain cost |
| Distribution sources | X post 1, x402scan, 2 directory PRs (pending), GitHub repo | §1.7 |
| Customer feedback | 3 people (Alex, Story91, Noaman), relayed 2026-10-15: install friction, integration/payment confusion, site design. **No confirmed paid use among them** | `EXPERIMENT.md` Feedback table |
| Technical failures | _unknown_: no monitoring; Bankr logs only | owner: `bankr x402` dashboard / logs |
| **Threshold: ≥ 3 external wallets, each paying on ≥ 2 UTC days** | **_pending_** (0 of 3 at last count) | D-033 |

**Honest prior [hypothesis]:** reaching the bar needs a change from 0 external wallets to 3 repeat payers in the remaining 7 days. That is unlikely without direct outreach. Week 1 therefore pairs closing the experiment with targeted outreach. Outreach-driven payers are counted and labelled separately, so we can tell sources apart.

---

## 3. Market research (summary; sources linked)

**Method:** web search and fetch on 2026-10-15. Many vendor sites failed DNS from the fetch tool, so some claims rest on search snippets. Labels: **[E-opened]** = page read; **[E-snippet]** = search summary only; **[H]** = hypothesis.

### 3.1 The finding that changes the picture
**[E-opened]** oasdiff, the category leader (Apache-2.0, 1.4k★, v1.33.0 on 2026-10-01), runs a **free hosted MCP server: no install, no API key**. It offers breaking changes, changelog, diff and validate, with inline specs, YAML and OpenAPI 3.1 (162 rule IDs). It installs into Claude Code with **one command**. [oasdiff docs/MCP.md](https://github.com/oasdiff/oasdiff/blob/main/docs/MCP.md), [OpenAPI 3.1 support](https://github.com/oasdiff/oasdiff/blob/main/docs/OPENAPI-31.md).
**Consequence [H]:** Breakra's core idea is "a remote, keyless compatibility check for agents". That now exists **for free, with more coverage**. Breakra cannot win on that alone.

### 3.2 Landscape
| Tool | Price | Surfaces | 3.1 / YAML | Link |
|---|---|---|---|---|
| oasdiff | Free (Apache-2.0); Pro $100/mo [E-snippet] | CLI, Action, hosted MCP, PR review link | Yes / Yes | [repo](https://github.com/oasdiff/oasdiff), [action](https://github.com/oasdiff/oasdiff-action) |
| OpenAPITools/openapi-diff | Free | CLI, Docker, Maven | 3.0 / Yes | [repo](https://github.com/OpenAPITools/openapi-diff) |
| pb33f openapi-changes | Free | CLI, TUI, HTML report | Yes / Yes | [repo](https://github.com/pb33f/openapi-changes) |
| Optic | — | **Archived 2026-01-12** (team joined Atlassian) | — | [repo](https://github.com/opticdev/optic) |
| Speakeasy | Commercial | Breaking-change report on spec PRs (SDK pipeline) | Yes / Yes | [docs](https://www.speakeasy.com/docs/sdks/guides/sdk-preview-breaking-changes) |
| CodeRabbit | Commercial | Runs oasdiff in AI code review [E-snippet] | via oasdiff | [docs](https://docs.coderabbit.ai/tools/oasdiff) |
| Other MCP servers and skills | Mostly free | SpecShield MCP, OpenAPI Contract Guard MCP, Tessl `openapi-contract-diff` skill (wraps oasdiff), skills.sh `api-contract-diff` [E-snippet] | varies | [SpecShield](https://glama.ai/mcp/servers/oh5ie8hwl3), [Tessl](https://tessl.io/registry/testland/openapi-contract-diff) |
| Apify OpenAPI-diff actors | Pay per use, ≈ $3 / 1,000 calls [E-snippet] | Hosted API | ? | [example](https://apify.com/imapp/api-changelog-generator) |

**Breakra is the only tool found that is JSON-only and 3.0-only.**

### 3.3 x402 market
- **Real volume is small and disputed.**
  - [E-snippet] CoinDesk (2026-03-11): about $28k of real daily volume, "much of it from testing and gamed transactions" ([CoinDesk](https://www.coindesk.com/markets/2026/03/11/coinbase-backed-ai-payments-protocol-wants-to-fix-micropayment-but-demand-is-just-not-there-yet)).
  - A June 2026 dataset: about 7% genuine settlement, about 516 real services ([dataset](https://huggingface.co/datasets/crestsystems/state-of-x402)).
- **No evidence found of agents paying for developer tools at scale.** The observed categories are LLM inference, DeFi/market data and search/scraping. This is an evidence gap, not proof of absence.
- **Discovery channels:**
  - Coinbase Bazaar ([docs](https://docs.cdp.coinbase.com/x402/bazaar.md)). It auto-indexes on settlement through the CDP facilitator; Breakra settles through Bankr instead.
  - x402scan, Agentic.Market and Bankr discovery.
  - BankrBot/skills is **almost entirely crypto/DeFi** [E-opened]; its users may not be API developers.

### 3.4 Answers to the brief's questions
| Question | Answer | Basis |
|---|---|---|
| What does Breakra do better or differently? | A richer per-finding record (rule id, operation, location, evidence, reason, recommended action), an explicit `unknown` / `non_contract` class, a stable `analysis_id`, and payment built into the protocol for wallet-holding agents. **Not** coverage depth: oasdiff has far more rules | [E] schema comparison; [H] value |
| Why pay $0.02 instead of a free local tool? | **Rarely, today.** Plausible only for (a) wallet-native agents (Bankr, AgentKit) that discover tools through x402 directories and never see oasdiff, (b) sandboxed agents that can make HTTP calls but can't install binaries or MCP servers, (c) buyers who value the verdict plus recommended action. Price isn't the barrier; **needing a wallet is** | [H] |
| Is x402 an advantage or friction? | **Both, by audience.** An advantage for crypto-native agents (no signup, auto-discovery). **Friction** for mainstream developers and CI (fund a Base USDC wallet, put a key in CI). Story91's "payment confusion" is one data point for the friction side | [E] market data + 1 feedback; [H] split |
| What causes repeated checks? | CI gates on every spec PR, SDK regeneration, versioning and release decisions, governance approvals. Repetition comes from **being in a pipeline**, not from one-off curiosity | [E] oasdiff/Speakeasy docs; Postman 2025 reports only 17% doing contract testing [E-snippet] ([Postman](https://www.businesswire.com/news/home/20251008162423/en/One-in-Four-Developers-Now-Design-APIs-for-AI-Agents-According-to-Postmans-2025-State-of-the-API-Report)) |
| Best coding-agent workflows | (1) An agent editing a spec checks "before vs after" before committing. (2) Release / semver decisions. (3) An agent regenerating a client asks "safe to regenerate?". Best fit: **wallet-native agents**; next, Claude Code / Codex users who already hold a wallet | [H] |
| How do users discover and install it? | Today: the README, breakra.dev, SKILL.md (manual), x402scan, two pending directory PRs. Missing: an MCP registry entry, skills.sh / Tessl listings, a one-line install | [E] audit |
| What prevents adoption? | A free, stronger keyless competitor (oasdiff MCP); JSON + 3.0 only; wallet setup; no free evaluation; no CI/PR path; discovery mostly in crypto directories | [E] + [H] |
| Which missing features are genuinely necessary? | **Unvalidated by our own users.** By market evidence: YAML and 3.1 (most real specs are YAML; 3.1 is common), then a free evaluation path. **No user of ours has asked for them yet.** The only requests are install ease (Alex) and integration/payment clarity (Story91) | [E] competitors; [H] ranking |

---

## 4. Owner verification guide (run on your machine; paste the outputs back)

Run from the repo: `cd ~/breakra && git pull`. **Never paste private keys or your RPC key.** Steps 1–3 cost nothing.

**Step 1 — Live endpoint (free)**
```bash
# Site, agent docs, discovery file: expect 200, 200, 200, 200
for p in / /skill.md /openapi.json /.well-known/x402; do printf "%s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://breakra.dev$p"; done

# Unpaid call through the forward and direct: expect HTTP 402 with a payment-required header
curl -si -X POST -H 'content-type: application/json' --data @examples/request.json https://breakra.dev/api/analyze | head -15
curl -si -X POST -H 'content-type: application/json' --data @examples/request.json \
  https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze | head -15

# Decode the payment terms: expect scheme exact, network eip155:8453, amount 20000, payTo 0x8AEE…01a0
curl -si -X POST -H 'content-type: application/json' --data @examples/request.json https://breakra.dev/api/analyze \
  | grep -i '^payment-required:' | cut -d' ' -f2 | tr -d '\r' | base64 -d | jq '.accepts[0] | {scheme,network,amount,payTo,maxTimeoutSeconds}'

# The project's own free check (signs nothing)
bun scripts/verify-live.ts V0
VERIFY_URL=https://breakra.dev/api/analyze bun scripts/verify-live.ts V0
```

**Step 2 — Bankr records (free)**
```bash
bankr x402 list                         # every service you run: name, PRICE, status. Paste all of it.
bankr x402 revenue breakra-analyze      # Breakra's calls and revenue (note the time window it covers)
```
If either command isn't in your CLI version (`logs`/`update` weren't in 0.3.45), use the dashboard instead. Also screenshot the Bankr dashboard's x402 section for `breakra-analyze`: request count, 402s, errors, last 30 days.

**Step 3 — On-chain metrics (free; read-only)**
```bash
BASE_RPC_URL="$ALCHEMY_BASE_URL" bun run metrics -- --since 2026-10-08
```
Set `ALCHEMY_BASE_URL` in your shell first, and don't paste it.

**Step 4 — Your wallet list.** Write down every wallet you control **or funded for someone**: Bankr agent wallets, other apps, testers. Addresses only.

**Step 5 — Vercel plan.** Vercel dashboard → the team/project → Settings → Billing: is it **Hobby** or **Pro**?

**Step 6 — Distribution status.** Open [BankrBot/skills#771](https://github.com/BankrBot/skills/pull/771) and [awesome-x402#1766](https://github.com/xpaysh/awesome-x402/pull/1766) and note any review comments. Also tell me whether X post 2 went out (link), and roughly the reactions on post 1.

**Optional Step 7 — one paid check ($0.02, needs your explicit go).** This is the only way to prove the paid path works today:
`VERIFY_URL=https://breakra.dev/api/analyze bun scripts/verify-live.ts V4`

**How I'll reconcile (when you paste):**
- Breakra-classed calls on-chain over Bankr's window must **equal** Bankr's call count.
- Any service in `bankr x402 list` priced at $0.02 → its calls are separated by tx hash.
- Any payer on your wallet list → moved from external to self.
- Only then does the scorecard (§2) get numbers.

---

## 5. Week 1 task board (Oct 16–22), by urgency

| # | Task | Owner | Why now | Done when | Cost |
|---|---|---|---|---|---|
| 1 | **Run the verification guide, steps 1–6** | Owner (Claude reconciles) | Every later decision depends on real numbers; the live state is unverified since Oct 9 | Outputs pasted; scorecard reconciled; unknowns listed | $0 |
| 2 | **Confirm the Vercel plan; decide upgrade / move** | Owner decides; Claude drafts the decision | Possible terms breach on a paid endpoint (S1) | The plan is confirmed; if Hobby, a decision is recorded as a new D-### | $0 to decide; Pro has a monthly fee |
| 3 | **Follow up with Story91** (the only possible integrator) | Owner sends; Claude drafts 3 questions | The single strongest lead, and it's cooling | We know what CashBoard would call, where the payment/integration broke, and whether they'd pay | $0 |
| 4 | **Ask Alex and Noaman one clarifying question each** | Owner sends; Claude drafts | Turn suggestions into evidence (which agent? what install path? what was confusing on the site?) | Answers logged in EXPERIMENT.md | $0 |
| 5 | **Targeted outreach to 10–15 wallet-native agent builders and API developers** | Owner sends; Claude drafts and lists targets (Bankr ecosystem, x402 builders, API maintainers) | The bar can't be met by passive listing; 7 days left | Messages sent; replies and resulting payments logged **with source** | $0 |
| 6 | **Daily metrics run** (Oct 17, 19, 21, 22) | Owner runs; Claude logs | The experiment must close with real data | 4 rows in the EXPERIMENT.md daily table | $0 |
| 7 | **Send the Bankr bazaar email** (draft ready) | Owner | Free discovery improvement; the draft is waiting | Sent; any reply logged | $0 |
| 8 | **Close the experiment (Oct 22): day-14 evidence report + scorecard** | Claude | D-033 | Report committed; continue / revise / pause recommendation | $0 |
| 9 | *(Needs approval)* Small safety fixes: `*.key` in .gitignore (S7); a note in SKILL.md and README that large specs (>500 KB) should use the direct Bankr URL (S2); metrics script excludes owner wallets via an env var (S4) | Claude, one PR | Low-risk hygiene; no feature, no deploy | PR green; you merge | $0 |
| 10 | *(Needs approval)* Optional paid live check (step 7) | Owner | Proves the paid path still works | 200 + matching `analysis_id` | $0.02 |

**Not in Week 1 (on purpose):** YAML/3.1, a GitHub Action, an MCP server, a free tier, site redesign, price changes. All wait for the Week 2 decision (D-033 freeze, and no user evidence yet).

## 6. Weeks 2–4 (outline; detailed after Week 1 data)
- **Week 2 (Oct 23–29) — Decide.**
  - Continue / revise / pause on the scorecard plus feedback.
  - If revising, fix **one** obstacle. Current front-runners are the **install path** (Alex) and **payment/integration clarity** (Story91).
  - A cheap test: a "first call in 5 minutes" guide plus a one-line skill install, before any engine work.
  - YAML/3.1 only if an actual user is blocked by it.
- **Week 3 (Oct 30–Nov 5) — Real workflows.**
  - 3–5 external developers each run one real spec change through Breakra from their own coding agent.
  - Measure: completed (yes/no), time to first result, where they got stuck, whether they'd call it again, and whether they pay a second time unprompted.
  - Any funded test wallets are counted as **sponsored**, never external.
- **Week 4 (Nov 6–12) — Evaluate.** Repeat usage, unit economics (net per call vs Vercel/domain costs), reliability (failures, latency), and which channels produced callers. Recommend the next milestone or a pause.

## 7. Risks
| Risk | Type | Note |
|---|---|---|
| A free, stronger keyless competitor (oasdiff MCP) | Commercial | The main strategic risk; Breakra's angle must be wallet-native agents or a distinct output |
| x402 demand for developer tools is unproven | Commercial | Market volume is small and gamed; no developer-tool evidence |
| JSON + 3.0 only | Product | Rejects much of the real-world input |
| Vercel Hobby terms | Compliance | §1.11 |
| Charged-without-result through the forward on large specs | Technical | §1.12 S2, unreproduced |
| Metrics miscount | Measurement | §1.10 |
| Single dependency on Bankr (30 s cap, no rollback, no logs CLI) | Technical | Recorded in notes, Appendix D |
| Revenue mixed with other services | Accounting | §1.10 |

## 8. Provisional recommendation (final on Oct 22)
- **[H]** Unless reconciliation shows external repeat payers, the likely outcome is **revise, not continue**.
  - The evidence so far points to **getting started** (install, pay, integrate) as the obstacle, not engine quality.
  - The market shows a free competitor that already covers the generic case.
- A "revise" should test **one** narrow bet. The most supported candidate: make the first paid call trivial for **wallet-holding agents**, with Story91/CashBoard as the first real integration, and measure whether they pay again.
- **Pause** if outreach plus that one fix produce no repeat external payer by Nov 12.

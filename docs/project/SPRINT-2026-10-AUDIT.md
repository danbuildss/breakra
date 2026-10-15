# Breakra — Sprint Audit and Four-Week Plan (Oct 16 – Nov 12, 2026)

**Status:** DRAFT for owner approval (written 2026-10-15, day 7 of the 14-day experiment). Nothing in this document is approved, built, deployed or spent.
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

**Live behaviour today: not verified by Claude.** From this sandbox every request to breakra.dev, x402.bankr.bot, x402scan and the Base RPCs gets a proxy 403. The last live evidence is from 2026-10-09. The owner should run the check in §11 before any of this is called "live".

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
- **Repo:** no issues, no wrong-finding reports and no outside PRs on danbuildss/breakra [verified].
- **`EXPERIMENT.md` Feedback table:** empty [verified].
- **Pasted feedback:** the owner said on 2026-10-15 that they have feedback and comments to share; **not yet received**.
- **One external written assessment** (pasted 2026-10-11). It suggested a web UI, a GitHub Action, YAML/3.1, more examples, a free preview, consumer context and auto-fix. These are opinions, not usage evidence.

### 1.9 Revenue, paid calls and external wallets
| Metric | Last known value | Source |
|---|---|---|
| Self-paid Breakra calls | 5 by 2026-10-08 21:44 UTC, plus the V4 check through breakra.dev on 2026-10-09 | [recorded] |
| External paid calls | **0** as of 2026-10-08 21:44 UTC | [recorded] first `bun run metrics` |
| External paid calls since day 1 | **Unknown**: no metrics run has been pasted since launch | — |
| Payout wallet | 267661 (0.267661 USDC), which **includes the owner's other Bankr services** | [recorded] |
| Burner | 184000 (0.184 USDC) | [recorded] |

**Measurement caveat [verified in code]:**
- `scripts/lib/metrics.ts` identifies Breakra calls by a gross of exactly 20000 to the router and then to our payout wallet.
- If any other service of the owner's on the same payout wallet is also priced at $0.02, its calls would be counted as Breakra's.
- **The owner must confirm no other service costs $0.02**, or the count must be cross-checked against `bankr x402 revenue breakra-analyze`.

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
| Customer feedback | _pending_ (owner to paste) | `EXPERIMENT.md` Feedback table |
| Technical failures | _unknown_: no monitoring; Bankr logs only | owner: `bankr x402` dashboard / logs |
| **Threshold: ≥ 3 external wallets, each paying on ≥ 2 UTC days** | **_pending_** (0 of 3 at last count) | D-033 |

**Honest prior [hypothesis]:** reaching the bar needs a change from 0 external wallets to 3 repeat payers in the remaining 7 days. That is unlikely without direct outreach. Week 1 therefore pairs closing the experiment with targeted outreach. Outreach-driven payers are counted and labelled separately, so we can tell sources apart.

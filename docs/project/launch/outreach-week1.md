# Week 1 follow-ups and targeted outreach (Oct 16–22) — DRAFTS

**Status:** drafts for owner approval. **Only the owner sends.** No spending, no paid offers, no sponsored calls.
**Goal:** turn three pieces of feedback into evidence, and find out whether *anyone outside* will make a first paid call, then a second one on another day.
**Rules:**
- Honest claims only: OpenAPI 3.0 JSON only, $0.02 per call, errors free, live on Bankr.
- No "AI-powered" hype, and no implied traction (there is none yet).
- Log every message and reply in `EXPERIMENT.md` (Distribution log + Feedback), **with the channel**.

---

## 1. Follow-ups (send first; strongest signal per minute)

### Story91 — the only possible integrator (send Oct 16)
> Hey! Thanks for looking at Breakra for CashBoard. You mentioned the integration and payment got confusing. That's exactly what I want to fix, so a few quick questions:
> 1. What would CashBoard use it for? Checking your own API's changes, or the APIs you depend on?
> 2. Where did it get stuck: finding the endpoint, the 402 payment step, wallet/signing, or reading the result?
> 3. What are you calling from (Bankr agent, TypeScript, Python, something else), and does it already speak x402?
>
> If it helps, I can walk you through one call end to end. There's a small client that checks the terms and signs once: github.com/danbuildss/breakra/blob/main/examples/client.ts

*Log:* the answers to 1–3; whether a call was attempted; the payer wallet if one paid. That wallet is only "external" if it isn't funded by you.

### Alex — "easier to install as an agent skill" (send Oct 16)
> Thanks for the Breakra feedback about making it easier to install as a skill. To get it right:
> 1. Which agent do you use day to day (Claude Code, Cursor, Codex, a Bankr agent, other)?
> 2. What would "installable" look like for you: a skill folder you drop in, an MCP server, a one-line command?
> 3. Does your agent have a wallet with USDC on Base today? (Breakra is $0.02 per call via x402.)

*Log:* agent; preferred install form; wallet yes/no. A "no wallet" answer is evidence about x402 friction.

### Noaman — website colour scheme (send Oct 16; lowest priority)
> Thanks for the note on the Breakra site. Quick follow-up: was it the colours themselves, or did the page not make it clear what Breakra does and how to try it? What did you expect to see first?

*Log:* design taste vs comprehension. Only comprehension issues are worth acting on during the sprint.

**Owner to record:** the channel each of the three came through (X reply, DM, Telegram, other).

---

## 2. Targeted outreach plan (10–15 people, Oct 17–20)

**Who can actually pay today** [hypothesis from market research]: people whose **agents already hold a funded Base wallet**. Everyone else first has to set up a wallet, and a free tool exists (oasdiff MCP). So the list leads with wallet-native builders.

| Segment | Why they fit | How to find (owner, public info only) | Target count |
|---|---|---|---|
| **A. Bankr / x402 agent builders** | Agents already pay x402 per call; Breakra is listed for them | Authors of recent BankrBot/skills PRs and x402scan-listed services that ship or depend on APIs; the Bankr community | 6–8 |
| **B. Builders of agents that consume third-party APIs** (integrations, trading or data agents) | An upstream API change breaks their agent; "did my dependency's contract change?" | People posting about x402 agents on X who mention API integrations | 3–4 |
| **C. API maintainers who publish OpenAPI 3.0 JSON** | Their own changes need checking before release | Public repos with an `openapi.json` (3.0) changed in the last month | 2–3 (lowest fit: likely no wallet) |

**Selection rule:**
- Only people who publicly build in these areas.
- No mass DMs, no scraping, no tagging strangers in bulk.
- One message each; at most one follow-up after 3 days.

### Message A/B (DM or reply; adapt the first line to the person)
> Hi, I saw you're building [their agent/service] on x402. I made Breakra: your agent sends two versions of an OpenAPI 3.0 contract and gets back every breaking change with evidence and a suggested fix. $0.02 per call via x402 on Bankr; errors are free.
>
> Would it be useful when [their dependency] changes its API? If you try one call, I'd really value blunt feedback, especially on anything confusing about the payment step.
> Agent guide: breakra.dev/skill.md

### Message C (GitHub discussion or X; never an unsolicited PR)
> Hi, I built Breakra, a deterministic OpenAPI 3.0 compatibility check (breaking / potentially breaking, with evidence and a fix per change). Here's what it reports on GitHub's own spec: github.com/danbuildss/breakra/tree/main/demo/github-rest-api. It's pay-per-call via x402 ($0.02), aimed at coding agents. Would a check like this fit your release process? If not, what would?

---

## 3. X post 2 (already drafted, not yet posted)
The text and image are in `x-posts.md` (Post 2) and `docs/assets/x-demo.png`. **Recommended: post on Oct 16**, the same day as the follow-ups, so new visitors see a concrete demo.

## 4. How we'll measure Week 1 outreach
| Measure | Where |
|---|---|
| Messages sent, by segment and channel | EXPERIMENT.md Distribution log |
| Replies; reason given for not trying (wallet? free alternative? not relevant?) | EXPERIMENT.md Feedback |
| First paid calls and second-day paid calls by **non-owner** wallets | `bun run metrics` (reconciled), Oct 17, 19, 21, 22 |
| Who caused a payment | Ask the person, or match the wallet they share; otherwise "unattributed" |

**A wallet is not a person.** A payment from a wallet you funded is never external.

# Distribution kit for v0.2 (D-039, item 6)

**Drafts only. The owner submits.** Do this **after** engine 0.2.0 is deployed on Bankr and verified. Every listing below describes 0.2.0 features (YAML, 3.1, verdict, `uses`); none of them is true of the live endpoint until then.

Order, best fit first:
1. Circle Agent Marketplace
2. Bankr bazaar email
3. MCP registries
4. Skills directories
5. Update BankrBot/skills#771

---

## 1. Circle Agent Marketplace (agents.circle.com/services)
**What it is (from search results; check against Circle's "Get listed" page before submitting):**
- A curated x402 + USDC catalog.
- Manual review via a form.
- The seller's payout wallet is sanctions-screened.
- Endpoints are health-checked.
- An OpenAPI spec and a 402 on unpaid requests are expected.

**Have ready:**

| Field | Value |
|---|---|
| Service name | Breakra |
| One-line | Contract-safety check for AI agents: is this OpenAPI change safe, and does it break *you*? |
| Description | Send two versions of an OpenAPI 3.0/3.1 contract (JSON or YAML). You get a verdict (safe / review / block), a suggested semver bump, and every change classified with evidence and a recommended fix. Pass `uses` to see only the findings that affect the operations you call. Deterministic: the same inputs always give the same `analysis_id`. Breakra's own errors are never charged. |
| Category | Infrastructure (no "Developer tools" category exists) |
| Endpoint | `https://breakra.dev/api/analyze` (forwards to Bankr). Direct: `https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze` |
| Method | POST, `application/json` |
| Price | $0.02 USDC per successful call (x402 v2, scheme `exact`) |
| Network | Base, `eip155:8453` |
| OpenAPI | `https://breakra.dev/openapi.json` |
| Agent guide | `https://breakra.dev/skill.md` |
| Source | `https://github.com/danbuildss/breakra` (MIT) |
| Contact | hello.danbuilds@gmail.com |
| Payout wallet | ⚠️ See below |

**⚠️ Questions to raise with Circle (don't guess):**
- **Payout wallet:**
  - The 402 names **Bankr's fee router** (`0x8AEE…01a0`) as `payTo`, not your wallet. Bankr forwards to your payout wallet (`0xb98f…fa91`) in the same transaction.
  - Ask Circle which address they screen and health-check against, and whether a router `payTo` is accepted.
- **Discovery metadata:** Bankr's 402 has no Bazaar extension. If Circle requires it, the listing waits on Bankr (item 2) or on self-hosted x402 (VISION "Next").
- **Shared wallet:** your payout wallet also receives CORTX and other services' revenue. That's fine for screening, but it's the same separation issue as before.

---

## 2. Bankr bazaar email
Send `docs/project/launch/bankr-bazaar-request.md` as is. Add this line:

> Circle's Agent Marketplace and x402scan both read this metadata, so it would make every x402 Cloud seller listable there.

---

## 3. MCP registries (local server, free)
**Blocker:** registries expect an installable package. Until `breakra` is published to npm (an owner decision: it needs an npm account), the install command is a clone:
```
git clone https://github.com/danbuildss/breakra && cd breakra && bun install
claude mcp add breakra -- bun "$PWD/src/cli.ts" mcp
```

**After an npm publish** (needs: `private: false` in package.json, `npm publish` by the owner), the one-liner becomes:
```
claude mcp add breakra -- bunx breakra mcp
```

**Listing text (Glama / Smithery / official registry):**
- **Name:** Breakra
- **Tool:** `check_openapi_change`, read-only.
- **Description:** Is this OpenAPI change safe? Compare two versions of a contract (3.0/3.1, JSON or YAML). Get a verdict (safe/review/block), a semver bump, and every change classified with evidence and a fix. `uses` shows only what breaks you. Deterministic, runs locally, no API key, MIT.

---

## 4. Skills directories (skills.sh, Tessl)
Submit the repo's `SKILL.md` (name `breakra`). It already covers the free local path and the hosted path.

---

## 5. BankrBot/skills#771
- After v0.2 merges and deploys, Claude updates `breakra/SKILL.md` on the fork (author Dan, no AI attribution) so the PR shows 0.2.0.
- Then post the drafted reply to the reviewer, once breakra.dev checks pass.

---

## Measure
Log every submission in `EXPERIMENT.md` (Distribution log) with its date and link. Run reconciled `bun run metrics` weekly. The kill criterion is in `VISION.md` (2027-01-31).

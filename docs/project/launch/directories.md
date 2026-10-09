# Directory submissions (owner submits)

Research 2026-10-08 (Claude, read-only). Not suitable right now: Coinbase CDP Bazaar (indexes only endpoints settling through Coinbase's facilitator; Breakra settles through Bankr's), the x402.org ecosystem page (removed Jul 2026), and awesome lists that reject paid-API skills or brand-new projects (travisvn/awesome-claude-skills, hesreallyhim/awesome-claude-code, VoltAgent/awesome-agent-skills; revisit after real usage).

## 1. Bankr skills catalog — PR to github.com/BankrBot/skills
The best fit: Bankr's own catalog, which already lists paid x402 skills.

**Ready to upload: see `bankr-skills/README.md`** (format verified against their repo on 2026-10-09). The draft below is superseded by `bankr-skills/breakra/catalog.json`.
- Fork, add a folder `breakra/` with:
  - `SKILL.md`: copy of the repo root `SKILL.md` at submission time.
  - `catalog.json`: draft below. **Before submitting, compare it with a current folder in that repo** (field names were read from their repo on 2026-10-08 and may change).
- PR title: `Add breakra: OpenAPI breaking-change checks (x402)`.

```json
{
  "schemaVersion": 1,
  "slug": "breakra",
  "provider": "Breakra",
  "providerUrl": "https://github.com/danbuildss/breakra",
  "setup": [
    "Fund a wallet with a little USDC on Base",
    "POST old and new OpenAPI 3.0 JSON to https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze and pay $0.02 via x402"
  ],
  "install": {
    "type": "bankr",
    "repoPath": "breakra",
    "command": "install the breakra skill from https://github.com/BankrBot/skills/tree/main/breakra"
  }
}
```

## 2. x402scan — x402scan.com/resources/register ("Register This URL Only")
- URL: `https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze`
- It probes the unpaid 402. It wants `accepts[].amount = "20000"` (we have it) and an input schema under `extensions.bazaar`. **Unverified whether Bankr's 402 includes that schema**; if x402scan marks the URL "skipped", tell Claude.
- Optional pre-check: `npx -y @agentcash/discovery x402.bankr.bot -v`.

## 3. awesome-x402 — PR to github.com/xpaysh/awesome-x402
Checked 2026-10-09 (their `c45d14e`). Format: `- [Name](link) - Description.`; one change per PR; add at the **bottom** of the category.

Browser-only steps (GitHub forks automatically):
1. Open https://github.com/xpaysh/awesome-x402/blob/main/README.md → click the **pencil** (Edit). GitHub offers to fork: accept.
2. Press **Ctrl/Cmd+F**, find `### Developer Tools`. Its last line starts with `- [BountyVerdict]`.
3. Put the cursor at the end of that BountyVerdict line, press Enter, paste:

```
- [Breakra](https://breakra.dev) - OpenAPI 3.0 breaking-change checks for coding agents: send the old and new contract, get every change classified with evidence and a recommended fix. Single x402 endpoint, $0.02 USDC per call on Base; errors are free. ([OpenAPI](https://breakra.dev/openapi.json)) ([GitHub](https://github.com/danbuildss/breakra))
```

4. **Commit changes…** → message `Add Breakra to Developer Tools` → **Propose changes** → **Create pull request**. PR body: `Adds Breakra (OpenAPI breaking-change checks, x402 on Base) to Developer Tools. Live, MIT-licensed, listed on x402scan.`

## Automatic / passive
- **Bankr x402 marketplace:** listed automatically on deploy.
- **skills.sh:** indexes skills installed with `npx skills add danbuildss/breakra` (works now that the file is `SKILL.md`). No form.

## Needs a separate approval (new packaging work)
- **Claude plugin directory** (clau.de/plugin-directory-submission): requires packaging the repo as a Claude Code plugin (`.claude-plugin/plugin.json` + `skills/breakra/SKILL.md`). Approval of a paid-API skill is uncertain. Ask Claude only if you want it.

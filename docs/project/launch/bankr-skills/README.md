# Bankr skills catalog submission (owner)

Ready-to-upload folder for a PR to **github.com/BankrBot/skills**. Format checked against their repo on 2026-10-09 (commit `dc47eed`): each skill is a folder with `SKILL.md` (front matter `name` + `description`) and `catalog.json` (`schemaVersion` 1, `slug` = folder name, `provider`, `providerUrl`, `logo`, optional `demo`, `setup`, `install`), plus one row in their `README.md`.

`breakra/SKILL.md` is an exact copy of the repo's `SKILL.md` (a test fails if they drift). If `SKILL.md` changes after you submit, update the PR too.

## Steps (browser, about 5 minutes)

1. Open https://github.com/BankrBot/skills → **Fork**.
2. In your fork: **Add file → Upload files**, and drag in the whole `breakra/` folder from this directory (it must arrive as `breakra/SKILL.md` and `breakra/catalog.json`).
3. Open `README.md` in your fork → ✏️ edit. Add this row in the **Available Skills** table, after the `botchan` row and before `[Capacitr]` (rows are roughly alphabetical):

```
| [Breakra](https://breakra.dev) | [breakra](breakra/) | OpenAPI 3.0 breaking-change checks for coding agents. Send the old and new contract; get every change classified breaking / potentially breaking / compatible, with evidence and a recommended fix. Deterministic. Single x402 endpoint on Base, $0.02 USDC per analysis; errors are free. |
```

4. Commit to a new branch, then **Open pull request** to `BankrBot/skills:main`.
   - Title: `Add breakra skill: OpenAPI breaking-change checks (x402)`
   - Body (copy):

```
Adds `breakra/`: a skill for checking whether an OpenAPI 3.0 change breaks API consumers.

- Single x402 endpoint on Bankr x402 Cloud: https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze
- $0.02 USDC on Base per analysis; only a 200 is charged, errors are free.
- Deterministic findings with evidence and a recommended action; MIT-licensed source: https://github.com/danbuildss/breakra
- SKILL.md documents the payment terms to check before signing and the one-signature-per-call rule.
```

**Their repo rule:** no AI-attribution lines in commits or PR bodies (no "Co-Authored-By: Claude", no "Generated with Claude Code"). The texts above have none; keep it that way.

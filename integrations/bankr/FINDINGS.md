# Breakra × Bankr: test findings

**Run on 2026-11-20** by the owner in their own Bankr account, following [README.md](README.md). Personal details (wallet address, balances) removed.

## Result: works end to end

| Step | Result | Evidence |
|---|---|---|
| Install from GitHub (message 1) | ✅ Installed | `install the skill at https://github.com/danbuildss/breakra` (root `SKILL.md`; no catalog listing needed) |
| Paid hosted checks (message 2) | ✅ 2 calls, $0.02 USDC each, $0.04 total | Paid by the Bankr agent from the owner's wallet via x402 |
| Change 1 (`POST /orders` removed) | ✅ `block`, bump `major`, `analysis_id` `sha256:31f82ae74e79415f71c30fc6e0fa961c22a3ac16f941be5d6ddccd983909cb39` | Equals [`expected.json`](../fixtures/breaking/expected.json) |
| Change 2 (`GET /customers` added) | ✅ `safe`, bump `minor`, `analysis_id` `sha256:f32d9a2fc36710002398255d53271d91cf6ccc7a208122d6afdab81058769d68` | Equals [`expected.json`](../fixtures/safe/expected.json) |
| Evidence and fixes | ✅ Presented per finding | Rule ids (`operation.operation_removed`), reason, evidence (operation present before, `null` after), recommended fix; the `info.version` change correctly called non-contract |

Identical `analysis_id`s prove the agent made real Breakra calls on exactly these contracts: the result is reproducible for free with `npx -y breakra@0.2.2` (see README).

## The agent's answer (verbatim, as reported by the owner)

> **Change 1 — verdict: BLOCK**
> suggested bump: major
> analysis_id: sha256:31f82ae74e79415f71c30fc6e0fa961c22a3ac16f941be5d6ddccd983909cb39
>
> One breaking finding:
>
> change-001 / operation.operation_removed
> - what: POST /orders was removed entirely
> - why it breaks: any caller hitting that endpoint will get errors
> - fix: find and replace all calls to POST /orders
> - evidence: the operation existed in before (summary: "Create an order", 201 response) and is null in after
>
> The version bump from 1.0.0 → 1.1.0 is a non-contract metadata change, no action needed there.
>
> **Change 2 — verdict: SAFE**
> suggested bump: minor
> analysis_id: sha256:f32d9a2fc36710002398255d53271d91cf6ccc7a208122d6afdab81058769d68
>
> No breaking or potentially-breaking findings. Two changes, both benign:
>
> change-001 / operation.operation_added
> - what: GET /customers added
> - compatible — additive, well-behaved callers unaffected, no action required
>
> change-002 / document.document_metadata_changed
> - what: info.version 1.0.0 → 1.1.0
> - non-contract, no action required
>
> tl;dr: Change 1 is a breaking removal — block it or ship as a new major version with a migration path. Change 2 is purely additive — ship it.

## Friction

None reported in this run: two messages, no setup beyond a funded Bankr wallet. Not captured in the transcript: whether the agent showed the x402 terms before each payment (the skill tells it to check them). The screen recording will show it.

## What to show the Bankr team

- This page and the recording: install from GitHub in one message, two paid checks, correct verdicts with evidence and fixes, verifiable `analysis_id`s.
- Status to state accurately: the skill installs from GitHub today; the catalog listing ([BankrBot/skills#771](https://github.com/BankrBot/skills/pull/771)) is still awaiting review.

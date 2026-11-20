# Breakra × Aeon: test findings

**Local pre-checks and a real Aeon run both done (2026-11-20).** The skill works; Aeon's community-pack install path has gaps (below).

## Local pre-checks (2026-11-20, against upstream aeonfun/aeon @ `8c0bbab`)

| Check | Command (in an aeon checkout) | Result |
|---|---|---|
| Pack validator | `scripts/validate-pack.sh <breakra checkout> --path integrations/aeon` | ✅ valid, 0 warnings |
| Security scan | `scripts/skill-scan.sh integrations/aeon/skills/breakra-check/SKILL.md` | ✅ PASS, no findings |
| Installer dry run | `bin/install-skill-pack danbuildss/breakra --path integrations/aeon --dry-run` | ✅ 1 would install, scan passed, capabilities `read_only sends_notifications` |
| Real install (scratch copy of aeon) | same, without `--dry-run` | ✅ `skills/breakra-check/` with fixtures, `aeon.yml` entry `enabled: false, schedule: "workflow_dispatch"`, `skills.lock` provenance, catalogs regenerated |
| Category check | `scripts/check-skill-categories.sh` | ✅ OK (`dev`) |
| Demo commands from the installed skill, published package | `npx -y breakra@0.2.2 check skills/breakra-check/fixtures/…` | ✅ breaking: `verdict: block`, exit 1, `analysis_id` `sha256:31f82ae7…cb39`; safe: `verdict: safe`, exit 0, `sha256:f32d9a2f…9d68` (both equal `expected.json`) |

The installer was run with GitHub's archive download served from a `git archive` of the pushed commit, because the test machine's network blocks GitHub's tarball host. The Claude-driven skill run itself (reading SKILL.md, notifying) needs a real Aeon instance and is not tested yet; neither is PR mode.

**Friction found (Aeon side, affects every community pack):** `bin/install-skill-pack` doesn't add installed skills to `eyebrowlock.json`, but `ci-skill-integrity.yml` runs on every PR touching `skills/**` and fails when a skill has no lockfile entry ("run: eyebrow scan --path . --lockfile eyebrowlock.json"). So the `install-skill` PR will show a red check until the operator regenerates the lockfile. Worth raising with Aeon's maintainers, with this reproduction.

## Real run (2026-11-20, owner-controlled test instance)

Instance: [`danbuildss/aeon-breakra-test`](https://github.com/danbuildss/aeon-breakra-test), a public "Use this template" copy of `aeonfun/aeon`, Claude Code harness (`claude-sonnet-5-5`), never a partner's repository.

### Result: the skill works; the community-pack install path needs fixes on Aeon's side

| Step | Result | Evidence |
|---|---|---|
| `install-skill` with `danbuildss/breakra --path integrations/aeon` | ❌ Blocked by Aeon, not by the pack | The agent's first command, `bin/install-skill-pack … --dry-run`, was denied: "claude denied tool call(s) under --allowedTools: Bash(bin/install-skill-pack>)". It stopped honestly and changed nothing (run #1). |
| Documented fallback: `bin/install-skill-pack danbuildss/breakra --path integrations/aeon` from a local clone | ✅ Installed | [PR #6](https://github.com/danbuildss/aeon-breakra-test/pull/6): `skills/breakra-check/` + fixtures, `aeon.yml` entry (disabled, `workflow_dispatch`), catalogs. Security scan passed. |
| `breakra-check` demo run (manual Run workflow, empty var) | ✅ Correct verdicts, agent acted on them | Run #2 ("skill: breakra-check"); output committed to `output/.chains/breakra-check.md`; Aeon's own quality score: 4 |
| Change 1 (`POST /orders` removed) | ✅ **BLOCK**, bump major, `analysis_id` `sha256:31f82ae74e79415f71c30fc6e0fa961c22a3ac16f941be5d6ddccd983909cb39` | Equals [`expected.json`](../fixtures/breaking/expected.json); "Don't merge: restore POST /orders or ship it in a new major version." |
| Change 2 (`GET /customers` added) | ✅ **SAFE**, bump minor, `analysis_id` `sha256:f32d9a2fc36710002398255d53271d91cf6ccc7a208122d6afdab81058769d68` | Equals [`expected.json`](../fixtures/safe/expected.json) |
| Notification | Skipped | No notification channel configured in the test instance (`./notify` skips silently); the report is in the run output |

The same two `analysis_id`s came back from the Bankr agent's hosted calls: one deterministic result on two platforms.

### The agent's output (verbatim, `output/.chains/breakra-check.md`)

```
## Breakra check: demo

### Breaking change
**Verdict: BLOCK** · bump: major
- Operation POST /orders was removed. Callers of it will receive errors. → Find and replace all calls to POST /orders.
analysis_id: sha256:31f82ae74e79415f71c30fc6e0fa961c22a3ac16f941be5d6ddccd983909cb39
Don't merge: restore POST /orders or ship it in a new major version.

### Safe change
**Verdict: SAFE** · bump: minor
analysis_id: sha256:f32d9a2fc36710002398255d53271d91cf6ccc7a208122d6afdab81058769d68
No change that may break callers (GET /customers added).
```

## Friction found (Aeon side; affects every community pack, not just Breakra)

Each one reproduces on a fresh template copy of `aeonfun/aeon` @ `8c0bbab`:

1. **`install-skill` can't run its own installer in Actions.** The skill tells the agent to run `bin/install-skill-pack`, but `scripts/skill_mode.sh` has no `Bash(bin/install-skill-pack:*)` (or `bin/generate-*`) in the allowlist, so the call is denied and the dashboard's "Install" path can't complete.
2. **No skill icon.** The installer doesn't add a glyph to `catalog/skill-icons.json`, so `node bin/generate-skill-icons --check` (and test `anatomy skill integration`) fail.
3. **`packs.json` can't match CI.** The installer builds it from `skills.lock`, which `.gitignore` excludes, so `ci-packs-json` regenerates a different file ("packs.json is stale").
4. **No integrity-lock entry.** `eyebrowlock.json` isn't updated, so `ci-skill-integrity` fails ("has no eyebrowlock.json entry").
5. **First-party docs parity.** `ci-readme-catalog` (and the `README first-party catalog parity` test) require Aeon's own docs to list every skill and its count by hand ("93 skills" → 94 in 11 places), so any added skill turns an instance's CI red.

In the test instance, 2 and 3 were fixed by hand (icon added; `packs.json` regenerated without `skills.lock`); 4 and 5 were left red (4 needs Aeon's `eyebrow` scanner; 5 means editing Aeon's own docs). None of them affects running the skill.

## What to show Aeon's maintainers

- The demo run and this page: install the pack, run `breakra-check`, get BLOCK/SAFE with fixes and verifiable ids, no keys or payment.
- The five install-path gaps above with their reproduction: concrete, useful feedback whatever they decide about Breakra.
- The ask: would `breakra-check` be useful as an optional developer skill (community pack or catalog)?

# Breakra × Aeon: test findings

**Local pre-checks done (below); the real Aeon run is not done yet.**

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

## Real run (owner-controlled test instance)

| Step | Result | Evidence | Friction |
|---|---|---|---|
| `install-skill` with `danbuildss/breakra --path integrations/aeon` | | | |
| Security scan result | | | |
| Demo run: change 1 `block`, `analysis_id` matches | | | |
| Demo run: change 2 `safe`, `analysis_id` matches | | | |
| The agent acted on the verdict (report, notification) | | | |
| `/tmp` writable in read-only mode (needed for PR mode) | | | |

## Friction to fix

## What to show Aeon's maintainers

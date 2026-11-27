# Breakra × Aeon: skill pack

An optional [Aeon](https://github.com/aeonfun/aeon) skill, `breakra-check`, that checks whether an OpenAPI change may break API callers before it ships, and acts on the verdict. It runs the free, published Breakra CLI (`npx -y breakra@0.3.0`) inside the skill run: no keys, no payment, and the contracts never leave the runner.

> **Status:** a community pack maintained by Breakra, not an official Aeon skill. **Verified in a real Aeon run on 2026-11-20** ([findings](FINDINGS.md)).

## Install (one action)

In your Aeon instance, run the **`install-skill`** skill (dashboard → Run, or Actions → `aeon.yml` → Run workflow) with:

```
danbuildss/breakra --path integrations/aeon
```

Aeon downloads the pack, security-scans it, and opens a PR adding `skills/breakra-check/`. Like every installed skill it lands **disabled**.

> **Known issue (Aeon @ `8c0bbab`, 2026-11-20):** in Actions, `install-skill` is currently blocked from running the installer (its tool allowlist lacks `bin/install-skill-pack`). Until Aeon fixes it, install from a local clone of your instance and open a PR:
>
> ```bash
> bin/install-skill-pack danbuildss/breakra --path integrations/aeon
> ```
>
> The install PR may also fail some of Aeon's catalog checks (icon, `packs.json`, integrity lock, docs counts); they don't affect running the skill. Details: [FINDINGS.md](FINDINGS.md).

## Run it

1. Set `breakra-check` to `enabled: true` in `aeon.yml` (it's on-demand: `schedule: workflow_dispatch`).
2. **Run now** with an empty var: the bundled demo checks one breaking change and one safe change.
3. Or set var to `owner/repo#123 path/to/openapi.yaml` to check a pull request's contract against its base branch (public repos).

| Verdict | What the skill does |
|---|---|
| `block` | "Don't merge", every finding with its fix, critical notification |
| `review` | What to review and the fixes, warning notification |
| `safe` | Reports in the run output (PR mode stays quiet; the demo notifies) |
| error | "Unchecked", never "safe", warning notification |

## What the demo should show

| Change | Verdict | `analysis_id` |
|---|---|---|
| `POST /orders` removed | `block` (major) | see [`../fixtures/breaking/expected.json`](../fixtures/breaking/expected.json) |
| `GET /customers` added | `safe` (minor) | see [`../fixtures/safe/expected.json`](../fixtures/safe/expected.json) |

Breakra is deterministic, so the run's `analysis_id`s must equal the expected ones.

## Permissions and runtime
- `mode: read-only`: no repo writes, no `gh`; it reads files, runs `npx`, fetches public GitHub data with `curl`, and calls `./notify`.
- Capabilities: `read_only`, `sends_notifications`. No secrets.
- Needs Node.js (Aeon's workflow sets up Node 22) and npm registry access for `npx`.

## Files
- [`skills-pack.json`](skills-pack.json): the pack manifest.
- [`skills/breakra-check/SKILL.md`](skills/breakra-check/SKILL.md): the skill; fixtures alongside it.
- [`DEMO.md`](DEMO.md): recording plan. [`FINDINGS.md`](FINDINGS.md): results from a real Aeon run (filled in after the test).

# Breakra × Aeon: demo recording plan (30–60 s)

Recorded in an owner-controlled test instance of Aeon (a fresh copy of upstream), never a partner's production repo.

| Time | Show | Say (caption) |
|---|---|---|
| 0–10 s | `install-skill` run with `danbuildss/breakra --path integrations/aeon`; the install PR | "Install Breakra into Aeon: one skill run." |
| 10–20 s | `breakra-check: { enabled: true }` in `aeon.yml`, then Run now | "Enable it, run it." |
| 20–45 s | The run output / notification: change 1 **BLOCK** with the fix, change 2 **SAFE** | "Removing an endpoint: block, don't merge, here's the fix. Adding one: safe." |
| 45–60 s | The `analysis_id` next to `expected.json` | "Deterministic and free: the same check runs anywhere with npx." |

# Breakra × Bankr: proof kit

A Bankr agent installs the Breakra skill from GitHub and checks two OpenAPI changes through the hosted x402 API: one that breaks callers and one that doesn't. Two chat messages, $0.04 USDC.

> **Status:** the Breakra skill is **not** in the Bankr skills catalog yet ([BankrBot/skills#771](https://github.com/BankrBot/skills/pull/771) is awaiting review). This kit uses Bankr's documented install-from-GitHub path, which works for any public repo.

## Before you start
- A Bankr account with a little USDC on Base (two checks cost $0.04).
- Recommended for the test: set a low per-transaction limit (for example $1) at bankr.bot → Security. x402 payments count against Bankr's spending limits.

## Message 1: install the skill

```
install the skill at https://github.com/danbuildss/breakra
```

Bankr reads [`SKILL.md`](../../SKILL.md) at the repo root (when to call Breakra, the payment terms to check, how to read results).

## Message 2: check two changes

Paste exactly this (the contracts are the [shared fixtures](../fixtures/)):

````
Use the breakra skill to check two OpenAPI changes with the hosted Breakra API.
I authorize up to 2 payments of $0.02 USDC on Base from my wallet for this (one per change).
Check the payment terms before signing, and sign once per call. Send each contract as text.

Change 1, before:
```yaml
openapi: 3.0.3
info:
  title: Orders API
  version: "1.0.0"
paths:
  /orders:
    get:
      summary: List orders
      responses:
        "200":
          description: The orders
    post:
      summary: Create an order
      responses:
        "201":
          description: Created
```
Change 1, after:
```yaml
openapi: 3.0.3
info:
  title: Orders API
  version: "1.1.0"
paths:
  /orders:
    get:
      summary: List orders
      responses:
        "200":
          description: The orders
```

Change 2, before:
```yaml
openapi: 3.0.3
info:
  title: Orders API
  version: "1.0.0"
paths:
  /orders:
    get:
      summary: List orders
      responses:
        "200":
          description: The orders
    post:
      summary: Create an order
      responses:
        "201":
          description: Created
```
Change 2, after:
```yaml
openapi: 3.0.3
info:
  title: Orders API
  version: "1.1.0"
paths:
  /orders:
    get:
      summary: List orders
      responses:
        "200":
          description: The orders
    post:
      summary: Create an order
      responses:
        "201":
          description: Created
  /customers:
    get:
      summary: List customers
      responses:
        "200":
          description: The customers
```

For each change, tell me the verdict, the suggested version bump, every finding that may break callers with its evidence and recommended fix, and the analysis_id.
````

The agent calls `POST https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze`, receives the x402 terms (`exact`, Base, USDC, `20000` = $0.02), pays once, and gets the result.

## What a correct run returns

Breakra is deterministic: the same contracts always give the same `analysis_id`, whether they're sent as YAML text, JSON text or JSON objects. Compare the agent's answer with these (full results: [`breaking/expected.json`](../fixtures/breaking/expected.json), [`safe/expected.json`](../fixtures/safe/expected.json)).

| Change | Verdict | Bump | Finding | `analysis_id` |
|---|---|---|---|---|
| 1. `POST /orders` removed | `block` | `major` | breaking: Operation POST /orders was removed. Callers of it will receive errors. Fix: Find and replace all calls to POST /orders. | `sha256:31f82ae74e79415f71c30fc6e0fa961c22a3ac16f941be5d6ddccd983909cb39` |
| 2. `GET /customers` added | `safe` | `minor` | none that may break callers (New operation GET /customers.) | `sha256:f32d9a2fc36710002398255d53271d91cf6ccc7a208122d6afdab81058769d68` |

A matching `analysis_id` proves the answer came from a real Breakra call on exactly these contracts.

## Reproduce without Bankr (free, local)

```bash
git clone --depth 1 https://github.com/danbuildss/breakra && cd breakra/integrations/fixtures
npx -y breakra@0.3.1 check breaking/before.yaml breaking/after.yaml   # verdict: block, exit 1
npx -y breakra@0.3.1 check safe/before.yaml safe/after.yaml           # verdict: safe, exit 0
npx -y breakra@0.3.1 check breaking/before.yaml breaking/after.yaml --json | grep analysis_id
```

## Files
- [`DEMO.md`](DEMO.md): a 30–60 second recording plan.
- [`FINDINGS.md`](FINDINGS.md): what happened in the real Bankr test (filled in after the run).

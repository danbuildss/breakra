# Breakra vision

**Breakra is the contract-safety check for AI agents.**

Before an agent changes an API, or upgrades to someone else's, Breakra tells it whether the change breaks **you** or **your callers**. Every answer comes with the evidence, a clear verdict and the exact fix. Results are deterministic and verifiable. Breakra is free to run locally, and the hosted API is pay-per-use with no account, for agents that already hold a wallet.

## Why
Coding agents now edit API contracts constantly, and a change that passes the service's own tests can still break everyone who calls it. A breaking-change check has to be:
- **Cheap to call** inside an agent loop.
- **Exact enough to act on** without a person reading a diff.

## What makes Breakra different
| | |
|---|---|
| **A verdict, not a diff** | `safe` / `review` / `block`, a suggested semver bump, and a recommended action for every finding |
| **"Does this break *me*?"** | Pass the operations your code calls (`uses`) and get only the findings that affect you |
| **Evidence you can check** | Every finding carries a stable rule id, the location and the before/after values. The same inputs always give the same `analysis_id` |
| **Honest about uncertainty** | Changes the rules don't evaluate are `unknown`, never silently "safe" |
| **No account, two ways to run** | A free local CLI and MCP server (MIT), or the hosted API paid per call in USDC via x402 |

## Principles
- **Deterministic first.** No LLM in the analysis path. A finding is a rule plus evidence.
- **Untrusted input stays untrusted.** External `$ref`s and URLs are never fetched by default. Specs are never stored or logged.
- **Open core.** The engine is MIT. The hosted API sells convenience (nothing to install, pay per call), not the engine.
- **Evidence over features.** We build what callers ask for and what usage shows, and record each decision in [`docs/project/DECISIONS.md`](docs/project/DECISIONS.md).

## Roadmap
**Now (v0.2)**
- Verdict and semver advice.
- "Does this break me?" mode (`uses`).
- YAML input.
- OpenAPI 3.1 (where the engine supports it).
- Free local CLI and MCP server.
- Listings in agent marketplaces (Circle, MCP registries, skills directories).

**Next**
- A GitHub Action that comments on spec changes in pull requests.
- x402 payments with standard discovery metadata (Bazaar), on more networks.

**Later**
- More contract types: GraphQL, AsyncAPI.
- Signed, verifiable results.

## How we'll know
By **January 31, 2027**, Breakra should have either:
- at least 3 outside wallets paying on 2 or more different days each, or
- clear local adoption (CLI and MCP installs).

If neither happens, the hosted paid API pauses and Breakra continues as an open-source tool.

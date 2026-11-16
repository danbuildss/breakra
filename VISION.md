# Breakra vision

**Breakra is the contract-safety check for AI agents.**

Before an agent changes an API, or upgrades to someone else's, Breakra tells it whether the change may break **your callers** or **the operations you depend on**. Every answer comes with the evidence, a clear verdict and a recommended fix. Results are deterministic and verifiable. Breakra is free to run locally, and the hosted API is pay-per-use with no account, for agents that already hold a wallet.

## Why
Coding agents now edit API contracts constantly, and a change that passes the service's own tests can still break everyone who calls it. A breaking-change check has to be:
- **Cheap to call** inside an agent loop.
- **Exact enough to act on** without a person reading a diff.

## What makes Breakra different
| | |
|---|---|
| **A verdict, not a diff** | `safe` / `review` / `block`, a suggested semver bump, and a recommended action for every finding |
| **Usage-based filtering** | Pass the operations your code calls (`uses`) and get a verdict for just those. Today this filters contract changes; it doesn't read your code (that's Breakra Impact, below) |
| **Evidence you can check** | Every finding carries a stable rule id, the location and the before/after values. The same inputs always give the same `analysis_id` |
| **Honest about uncertainty** | Changes the rules don't evaluate are `unknown`, never silently "safe" |
| **No account, two ways to run** | A free local CLI and MCP server (MIT), or the hosted API paid per call in USDC via x402 |

## Principles
- **Deterministic first.** No LLM in the analysis path. A finding is a rule plus evidence.
- **Untrusted input stays untrusted.** External `$ref`s and URLs are never fetched by default. Specs are never stored or logged.
- **Open core.** The engine is MIT. The hosted API sells convenience (nothing to install, pay per call), not the engine.
- **Evidence over features.** We build what callers ask for and what usage shows, and record each decision in [`docs/project/DECISIONS.md`](docs/project/DECISIONS.md).

## Roadmap
**Now (v0.2, released)**
- Verdict and semver advice.
- Usage-based filtering (`uses`).
- YAML input; OpenAPI 3.1.
- Free local CLI and MCP server.
- Listings in agent marketplaces.

**Next (v0.3): Breakra Impact**
- Given a repository and two contracts, find **which files and lines of your code** use the operations and fields that changed. It is deterministic and starts with TypeScript/JavaScript.
- Code it can't resolve (dynamic URLs, computed field access) is reported as `unknown`, never as safe.
- It will be built against real breakages from developers who maintain integrations, and measured on whether it finds the right code.

**After that**
- **Fix instructions:** precise, deterministic guidance (what changed, where, what to update) that the developer's own coding agent turns into a patch. Breakra itself writes no code.
- **MCP tool-schema compatibility:** same engine, applied to MCP tool definitions.
- **A GitHub Action**, and x402 payments with standard discovery metadata on more networks.

**Later, only if usage justifies it:** monitoring third-party APIs over time, and shared compatibility evidence.

## How we'll know
By **January 31, 2027**, Breakra should have **either**:
- at least 3 outside wallets paying on 2 or more different days each, **or**
- at least 3 of the first 5 developers we work with running Breakra again, without being asked, on a real change.

If neither happens, the hosted paid API pauses and Breakra continues as an open-source tool. The local CLI and MCP server send no telemetry, so usage evidence comes from people, not tracking.

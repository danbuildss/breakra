# Changelog

## 0.2.0 (engine 0.2.0, rule set 0.2.0)

Breakra becomes the contract-safety check for AI agents ([`VISION.md`](VISION.md), D-039).

**Added**
- `verdict` (`safe` / `review` / `block`) and `suggested_version_bump` (`major` / `minor` / `patch` / `none`) in every result.
- `uses`: list the operations your code calls. The result's `impact` section gives a verdict for those operations (usage-based filtering; Breakra doesn't read your code).
- YAML input: `before` and `after` can be JSON objects, or JSON/YAML text.
- OpenAPI 3.1.0–3.1.1. Type lists, numeric `exclusiveMinimum` / `exclusiveMaximum`, `const` and `examples` are classified (see [`RULES.md`](RULES.md)).
- A free local CLI (`breakra check`) and MCP server (`breakra mcp`, tool `check_openapi_change`), running the same engine with no wallet and no network.

**Changed**
- `analysis_id` covers engine 0.2.0 and rule set 0.2.0, and includes `uses` when given. Ids from 0.1.x differ.
- Tests run under Bun, the same runtime as the hosted API.

**Unchanged**
- The price ($0.02 USDC on Base via x402), errors are free, the 1 MB limit, and no fetching of URLs or external `$ref`s.

## 0.1.1
- `$ref` parameters and request bodies are resolved before classification.
- Library console output is suppressed so specs never reach logs.

## 0.1.0
- First release: OpenAPI 3.0 JSON compatibility findings over x402.

# Breakra — Technical Architecture

## Intended request flow
Agent → HTTP input validation → x402 authorization/settlement integration → OpenAPI parser/normalizer → diff/compatibility rules → evidence-backed JSON response. **Exact payment-before/after-execution sequence depends on verified SDK/host behavior**; document before implementation.

## Proposed stack (not final until Phase 0 approval)
TypeScript; Node.js LTS; Hono or minimal handler; Zod or equivalent; maintained OpenAPI diff/parser library; Vitest; GitHub Actions; official x402 SDK; Base USDC; stateless serverless/container host. No DB or LLM in V0.

## Routes
- `POST /v1/analyze` — paid comparison.
- `GET /health` — free liveness.
- `GET /ready` — free readiness, no secrets.
- `GET /skill.md` — free agent instructions.
- `GET /openapi.json` — free API schema.
- `GET /pricing` — free pricing/network metadata.

## Input modes
1. `{ "before": { ... }, "after": { ... } }` — inline JSON OpenAPI 3.0.x.
2. `{ "before_url": "https://...", "after_url": "https://..." }` — optional public HTTPS JSON URLs only after SSRF protections pass review.
Reject mixed modes. Set explicit byte, depth, complexity, timeout and concurrency limits after benchmarks.

## Response contract (illustrative, finalize before coding)
```json
{
  "status": "success",
  "engine_version": "0.1.0",
  "rule_set_version": "0.1.0",
  "compatibility": "potentially_breaking",
  "summary": {"added": 0, "removed": 0, "modified": 1, "potentially_breaking": 1, "unknown": 0},
  "changes": [{
    "kind": "required_parameter_added",
    "operation": {"method": "GET", "path": "/users"},
    "compatibility": "potentially_breaking",
    "evidence": {"before": null, "after": {"name": "region", "required": true}},
    "recommended_action": "Review callers of GET /users"
  }]
}
```

## Classification discipline
Differentiate compatible, potentially_breaking, breaking, unknown. Request vs response direction matters. Unsupported constructs must be marked unknown, not silently ignored. A spec diff does not establish actual runtime behavior.

## Security invariants
Treat specifications as data, never code. Disable remote `$ref` resolution initially. For URL mode: HTTPS only, reject local/private/reserved/link-local/metadata addresses including IPv6; DNS validation plus connection pinning/rebinding defense; redirect revalidation or reject redirects; restrict ports; timeouts, max response size, nesting, concurrency. If host cannot enforce this, ship inline-only.

## Payment invariants
Use official supported x402 middleware/facilitator; verify recipient, chain, token, amount and settlement. Never store wallet private keys in repo/service. Clarify failure/refund/idempotency behavior before launch. Cheap preflight validation where compatible with host flow. Avoid promising zero charges on failed execution without proof.

## Observability
Aggregate requests, 402s, confirmed settlements, successes, failures, latency, cost, distinct paying wallets and repeat usage. No raw specs by default. Wallet count is not unique human customer count.

## Deferred architecture
Snapshots, schedulers, dashboard, MCP, semantic HTML extraction and LLM require separate owner approval.

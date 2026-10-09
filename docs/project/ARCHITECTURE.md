# Breakra — Technical Architecture

**As built in Phase 1 (2026-10-08).** Decisions: D-013 to D-017 (via D-020), D-023 to D-026, D-028. The original Phase 0 proposal is kept at the bottom for history.

## Request flow (Bankr x402 Cloud)

```
Agent ── POST ──▶ x402.bankr.bot/<wallet>/breakra-analyze
                   │  Bankr: 402 challenge → verify signed USDC authorization (Base)
                   ▼
            handler(req)  [dist/x402/breakra-analyze/index.ts: one self-contained file]
                   │  parse body (≤1 MB, D-031) → validate both specs (3.0.0–3.0.4, structure, local $refs)
                   │  → bound work (depth, nodes, operations, $ref expansion) BEFORE diffing
                   │  → canonicalize (sorted keys) → sha256 input hashes
                   │  → api-smart-diff 1.0.6 (raw changes only)
                   │  → Breakra rule set 0.1.0 (classification, direction, evidence, action)
                   │  → sort, de-duplicate, bound (500 changes, 1,000-char evidence)
                   ▼
            2xx only on complete analysis ──▶ Bankr settles via BankrFeeRouterV2 → owner wallet
            4xx/5xx on any failure       ──▶ Bankr does NOT settle (verified on-chain, T-001)
```

## Source layout

| Path | Responsibility |
|---|---|
| `src/index.ts` | Bankr handler: literal `export default async function handler(req)`. Maps errors to statuses and writes one privacy-safe log line. |
| `src/analyze.ts` | Pure pipeline: validate → canonicalize → hash → compare → classify → format. |
| `src/core/validate.ts` | Request parsing, OpenAPI 3.0.x structural checks, $ref inventory, depth/node/operation caps, expanded-size (ref-bomb) guard. |
| `src/core/limits.ts` | All bounds (calibrated in BENCHMARKS.md). |
| `src/core/compare.ts` | The only module that imports api-smart-diff. Its labels are discarded. |
| `src/core/classify.ts` | Rule set 0.1.0 (RULES.md). |
| `src/core/format.ts` | Deterministic ordering, ids, summary, output bounds. |
| `src/core/canonical.ts` | Canonical JSON and Web Crypto SHA-256 (no imports in the bundle). |
| `src/core/errors.ts` | Error codes → HTTP statuses (all non-2xx). |
| `scripts/build.ts` | Bundles to one file with no imports and the literal export; writes `dist/bankr.x402.json`. |
| `scripts/smoke.ts` | Runs the built artefact (CI runs it under Bun 1.4.2 **and** Bankr's 1.3.14). |
| `scripts/oracle.ts` | Cross-checks verdicts against oasdiff v1.33.0. |
| `scripts/bench.ts` | Manual benchmark on real GitHub API slices. |

## Contract
See `docs/API.md` (request, response, errors) and `RULES.md` (classification). Every field except `metadata.duration_ms` is deterministic.

## Security invariants (as implemented)
- Specs are data. No code execution. **No network access**: external `$ref`s are never fetched (a test stubs `fetch` to fail if touched).
- Inline input only (D-014). There is no URL mode, so there's no SSRF surface.
- All work is bounded before the synchronous diff runs. **$ref amplification is rejected** using an expanded-size estimate (`SPEC_TOO_COMPLEX`, free).
- Errors never echo input or internals. Unexpected failures return a sanitized 500 (free for the caller).
- Logs: one JSON line per request (outcome, status, code, size, change count, duration, `x-402-payer`). **Never** the body or `x-forwarded-for` (D-026).

## Payment invariants (verified in T-001)
- Bankr verifies and settles. Breakra holds no keys and has no payment code (D-017).
- **Only 2xx is charged**, so the handler returns 2xx only for a complete analysis (D-023).
- Payments go through `BankrFeeRouterV2` (`0x8AEE…01a0`) and are split per call to the owner's wallet (5% fee after the free tier).

## Deployment (Phase 3, not yet done)
`bun run build`, then deploy `dist/` with the **Bankr CLI** (`bankr x402 deploy breakra-analyze`), never via Bankr's agent (D-025). Then make a paid smoke call. Requires owner approval.

## Deferred architecture
Snapshots, schedulers, dashboard, MCP, URL mode, YAML, OpenAPI 3.1, semantic HTML extraction and LLM all require separate owner approval.

---

## Original Phase 0 proposal (superseded; kept for history)

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

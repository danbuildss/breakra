# Breakra — API Contract (engine 0.1.1, rule set 0.1.0)

**Status:** **LIVE** on Bankr x402 Cloud (Phase 3, 2026-10-08): `POST https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze` (one URL per deployment; there is no `/v1/analyze` path on Bankr). Price: $0.02 USDC on Base, paid via x402.

Agent guide: [`SKILL.md`](../SKILL.md). Machine-readable contract: [`openapi.json`](../openapi.json). Example: [`examples/`](../examples/).

Also reachable as `POST https://breakra.dev/api/analyze`: Vercel forwards it unchanged to the Bankr endpoint (same 402 terms, same payment recipient, same response). This address exists so x402 directories can read `breakra.dev/openapi.json` on the same origin (D-038).

## Request

`POST` with a JSON body containing exactly two fields:

```json
{ "before": { "openapi": "3.0.3", "info": { "title": "…", "version": "1" }, "paths": { } },
  "after":  { "openapi": "3.0.3", "info": { "title": "…", "version": "2" }, "paths": { } } }
```

- Both must be inline **OpenAPI 3.0.0–3.0.4 JSON** documents. YAML, OpenAPI 3.1, Swagger 2.0 and URL inputs are not supported in V0.
- Body ≤ **1 MB** total (D-031: Bankr's runtime is about 9× slower than local; this keeps the worst case well under Bankr's 30 s cap). Other bounds are listed in `BENCHMARKS.md`.
- Local `$ref`s (`#/…`) are resolved, including circular ones. **External `$ref`s are never fetched**; they're reported in `limitations` and as `unknown` changes.

## Success (HTTP 200, and the only status that is charged)

```json
{
  "status": "success",
  "analysis_id": "sha256:…",
  "engine_version": "0.1.0",
  "rule_set_version": "0.1.0",
  "spec_versions": { "before": "3.0.3", "after": "3.0.3" },
  "compatibility": "potentially_breaking",
  "summary": { "total_changes": 2, "breaking": 0, "potentially_breaking": 1, "unknown": 0, "compatible": 1, "non_contract": 0 },
  "changes": [
    {
      "id": "change-001",
      "rule": "request.required_parameter_added",
      "kind": "required_parameter_added",
      "compatibility": "potentially_breaking",
      "direction": "request",
      "operation": { "method": "GET", "path": "/users" },
      "location": { "in": "query", "name": "region" },
      "reason": "A new required query parameter `region` was added to GET /users. Callers that do not send it may be rejected.",
      "recommended_action": "Update callers of GET /users to send `region`.",
      "evidence": { "path": ["paths", "/users", "get", "parameters", "query:region"], "before": null, "after": { "name": "region", "in": "query", "required": true, "schema": { "type": "string" } } }
    }
  ],
  "limitations": [],
  "metadata": { "input_hashes": { "before": "sha256:…", "after": "sha256:…" }, "changes_omitted": 0, "duration_ms": 12 }
}
```

| Field | Meaning |
|---|---|
| `compatibility` | The most severe class across all changes (see RULES.md). |
| `changes[]` | Sorted by severity, then path, method and kind. **At most 500 are listed**; `summary` counts all of them and `metadata.changes_omitted` gives the remainder. |
| `rule` / `kind` | A stable identifier of the rule that produced the finding (RULES.md). |
| `direction` | `request`, `response`, `operation`, `security` or `document`. |
| `location` | Any of `in`, `name`, `status`, `media_type`, `field` (dot path; `[]` = array items), `keyword`. |
| `evidence.path` | The location in the **dereferenced** document; parameter indexes are shown as `in:name`. Values over 1,000 characters are truncated (`evidence.truncated: true`). |
| `analysis_id` | sha256 of the engine version, rule-set version and both canonical input hashes. **Every field except `metadata.duration_ms` is deterministic.** Key order and formatting don't affect results. |

## Errors (all non-2xx, so **never charged**; verified on-chain in T-001)

```json
{ "status": "error", "error": { "code": "UNSUPPORTED_OPENAPI_VERSION", "message": "…", "retryable": false, "details": { "side": "after" } } }
```

| HTTP | `code` | When | Retryable |
|---|---|---|---|
| 400 | `INVALID_REQUEST` | Not JSON or UTF-8; not exactly `before` + `after`; a spec isn't an object | no |
| 405 | `METHOD_NOT_ALLOWED` | Anything other than POST | no |
| 413 | `PAYLOAD_TOO_LARGE` | Body > **1 MB** (D-031; Bankr's gateway also rejects > ~5 MB before payment) | no |
| 422 | `INVALID_SPECIFICATION` | Missing or invalid `openapi`/`info`/`paths`, a malformed path or operation, a dangling local `$ref` | no |
| 422 | `UNSUPPORTED_OPENAPI_VERSION` | Swagger 2.0, OpenAPI 3.1+ | no |
| 422 | `SPEC_TOO_COMPLEX` | Nesting, node, operation or expanded-size (`$ref` amplification) limits exceeded | no |
| 500 | `ANALYSIS_FAILED` | Unexpected internal error (sanitized; nothing internal is exposed) | yes |

Error messages never echo submitted content or internal details.

## Rate limits

Breakra sets no rate limit of its own: every successful call is paid ($0.02), which bounds abuse, and every error is free. Bankr's gateway may apply platform limits (a 30 s request cap and a ~5 MB body cap were observed in T-001).

## Payment notes (from T-001, Bankr x402 Cloud)

- Unpaid requests receive HTTP 402 with x402 v2 requirements: `exact` scheme, `eip155:8453`, USDC, amount `20000` ($0.02; **verified live** in Phase 3 V0).
- **Only 2xx responses are settled.** 4xx/5xx are free, verified on-chain.
- Each new authorization is a separate charge; a reused payment is rejected (`402 Payment already used`).
- **No settlement receipt header is returned** to the buyer.
- Client caution: `@x402/fetch`'s wrapper can automatically re-sign and re-send a fresh payment in some recovery paths. Agents should use one signature per logical call.

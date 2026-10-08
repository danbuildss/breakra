# Breakra — Quality, Security and Release Gates

## Minimum core fixtures
- Identical specs; reordered JSON keys; description-only change.
- Added/removed operations.
- Added optional and required request parameters.
- Request schema narrowing; response field removal; enum change.
- Security scheme change; status code/media type change.
- Unsupported versions/features; invalid documents; recursive refs; oversized/deep inputs.
- Verify every reported finding includes evidence and correct directionality.

## URL security fixtures (only if URL mode enabled)
- localhost; private IPv4/IPv6; link-local; cloud metadata; DNS rebinding; redirect to private target; unusual ports; timeout; oversize response; external `$ref` fetching attempt.

## Payment fixtures
- Unpaid valid request → standard HTTP 402.
- Valid payment and actual settlement → result.
- Wrong network, token, amount, recipient, signature → rejection.
- Duplicate authorization and concurrent retry behavior.
- Analysis exception, settlement failure, response delivery failure.
- Confirm whether preflight invalid requests can avoid payment; never promise refund semantics not supported by host.

## Release gates
**Core:** typecheck/lint/tests pass, supported scope clear, deterministic fixtures validated.
**Security:** input bounds enforced, threat review, no secrets, negative tests.
**Payment:** verified SDK and real low-budget Base payment, logs reconcile with settlement evidence.
**Launch:** agent can follow `/skill.md`, payment result correct, rollback known, metrics active.

## T-001 infrastructure results log

| Date | Item | Command or source | Result | Evidence | Not tested |
|---|---|---|---|---|---|
| 2026-10-08 | Price-0 deploy (T11) | Bankr agent deploy | Rejected: `minimum 0.000001` | Live deploy error (relayed) | — |
| 2026-10-08 | Probe rev 1 build (with npm dependency) | Bankr agent deploy ×2 | **Build failed** | Bankr error message; `schema` lookup returns "Endpoint not found" | Cause (logs requested) |
| 2026-10-08 | Burner funding | Balance read | 0.04 USDC on Base | Portfolio read | — |

## Reporting format
Date | Commit/PR | Command | Result | Evidence | Not tested | Known risks.

No test should claim a real external service or blockchain settlement was exercised unless it actually was.

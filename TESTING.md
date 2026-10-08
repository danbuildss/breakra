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
| 2026-10-08 | Probe rev 4 deploy (no dependencies) | Bankr agent deploy; Claude checked `api.bankr.bot/x402/endpoints/schema/<wallet>/breakra-t001-probe` | **Live** v1, $0.001 USDC, base, GET+POST | Public schema API read by Claude | Paid behaviour (T0+) |
| 2026-10-08 | Lib deploy (pre-bundled single file) | Same, `breakra-t001-lib` | **Live** v1, $0.001 USDC, base, GET. **Built first try** | Public schema API read by Claude | Runtime result (T3) |
| 2026-10-08 | Failed builds' logs | Bankr agent | No logs exist: rejected before an endpoint record was created | Relayed by Bankr's agent | Root cause not proven |
| 2026-10-08 | **T5** handler 500 | `bun t001.ts T5` | **500** (handler JSON) in 500 ms. **Not charged:** burner 37000 and payout 124661 unchanged (08:01:49 UTC, also re-confirms T4) | Owner output + Claude balance reads | Positive-control lag check at T7 |
| 2026-10-08 | **T4** handler 400 | `bun t001.ts T4` | **400** (handler JSON) in **485 ms** (paid 200s took 1.1–3.4 s). **Not charged:** burner 37000 and payout 124661 unchanged (read 08:01:03 UTC) | Owner output + Claude balance reads | Lag re-check after T5 |
| 2026-10-08 | **T3** lib (pre-bundled) | `bun t001.ts T3` | **500, empty body, no content-type**, 1805 ms. **Not charged:** burner 39000→37000 and payout 122661→124661 across T2, T2 re-run and T3 = 2 charges for 3 calls (reads at 07:59:28 and 07:59:49, stable) | Owner output + Claude balance reads | Root cause (logs requested). Re-check for indexer lag at T4 |
| 2026-10-08 | **T2 re-run** env | `bun t001.ts T2` | **200** in 1230 ms. Runtime: linux **arm64**, **Bun 1.3.14** (node-compat 24.3.0, v8 13.6). RSS **60.3 MB** at idle. 7 env vars. **Outbound fetch works** (example.com → 200). Forwarded request headers: `accept, accept-encoding, content-length, host, user-agent, `**`x-402-payer`**`, x-amzn-trace-id, x-forwarded-for, x-forwarded-port, x-forwarded-proto, x-original-method, x-original-path` | Owner output | Memory ceiling (T10) |
| 2026-10-08 | **T2** env | `bun t001.ts T2` | 200 in 1120 ms. Runtime **Bun 1.3.14** (node-compat 24.3.0). **Rest of the body was truncated by the client (600-char cap, Claude's bug)**, so platform/arch, RSS, outbound fetch and request header names were lost | Owner output | Re-run as T2 after fixing the cap (+$0.001) |
| 2026-10-08 | **T1** paid OK | `T001_PAYTO=0x8AEE… bun t001.ts T1` (owner-approved payTo) | **200** in 3388 ms. **No PAYMENT-RESPONSE header returned.** Burner 40000→39000; payout 121661→**122661** (+1000, **full amount, 0% fee**) | Owner output + Claude balance reads 07:53 → 07:56 UTC | Tx hash (not returned) |
| 2026-10-08 | **T0** unpaid 402 | `bun t001.ts T0` (owner) | 402, valid v2 requirements, amount 1000, **payTo `0x8AEE…01a0` ≠ payout wallet** | Owner-pasted output | Payment (blocked pending approval) |
| 2026-10-08 | Burner funding | Balance read | 0.04 USDC on Base | Portfolio read | — |

## Reporting format
Date | Commit/PR | Command | Result | Evidence | Not tested | Known risks.

No test should claim a real external service or blockchain settlement was exercised unless it actually was.

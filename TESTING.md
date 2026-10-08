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
| 2026-10-08 | **T9a/b/c/d** body 100 KB / 1 MB / 4 MB / 6 MB | `bun t001.ts T9a`…`T9d` | 100 KB → 200 (1.3 s), 1 MB → 200 (4.4 s), 4 MB → 200 (16.1 s), each with the exact byte count and sha256 echoed (100 KB hash matches the local run). **6 MB → 413 `Request Entity Too Large` from the gateway on the *unpaid* request**: never reached payment, **not charged**. Charged 3× (burner 32000→29000, payout 129661→132661) | Owner output + Claude balance reads 08:08 UTC | Exact limit between 4 and 6 MB |
| 2026-10-08 | **T8a/b/c** sleep 5/15/25 s | `bun t001.ts T8a`, `T8b`, `T8c` | All **200**. Client wall time 7109 / 17522 / 26045 ms, so platform overhead is about 1.0–2.5 s. **25 s of handler time succeeds.** Charged 3× (burner 35000→32000, payout 126661→129661, 0% fee) | Owner output + Claude balance reads 08:06 UTC | 30 s cap itself (deliberately not hit) |
| 2026-10-08 | **T7** retry ×2 (positive control) | `bun t001.ts T7` | 200, 200 (871 / 812 ms). **Charged twice:** burner 37000→35000, payout 124661→126661 (+2000, 0% fee), visible within about 1 min (08:02:52 UTC). Separate signatures mean separate charges; no dedup | Owner output + Claude balance reads | Identical-signature replay (T12) |
| 2026-10-08 | **T6** handler throws | `bun t001.ts T6` | **500, empty body, no content-type** in 470 ms (platform-generated). **Not charged** (the T7 positive control proves no lag) | Owner output + Claude balance reads | — |
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

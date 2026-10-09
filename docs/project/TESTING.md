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
| 2026-10-09 | **x402scan registration attempt** (owner) | x402scan "Register" | **Failed:** `Missing input schema` for the Bankr URL; warning `info.contact.email` missing. Root cause (from x402scan + @agentcash/discovery 1.7.5 source): for `x402.bankr.bot` URLs it reads `https://x402.bankr.bot/openapi.json` (Bankr's, not ours) and the 402 challenge's `extensions.bazaar`; x402scan has no spec-URL override. Fixed what we control: `openapi.json` now uses `servers: x402.bankr.bot` + the real path, `x-payment-info` (fixed $0.02, x402), `info.contact.url`. Offline check with the discovery package: authMode paid, input `before`/`after`, output schema, 0 warnings | Source reading + offline run | Bankr's 402 body / openapi.json (blocked from sandbox; owner to run) |
| 2026-10-09 | **CodeQL failure on PR #15** | Local CodeQL 2.23.2, security-and-quality, same as CI | Before: 10 alerts. **The PR-blocking one:** `js/incomplete-multi-character-sanitization` in `tests/site.test.ts` (regex tag-stripping in a test; no runtime impact). Others pre-existing: `examples/client.ts` file→HTTP (by design), `experiments/` (archived), `scripts/bench.ts` unused initial value. Fixed the test and bench; config ignores `experiments/` and the file→HTTP rule. **After: 0 results, 199 queries.** 99/99 tests | Local CodeQL SARIF | GitHub re-run (on push) |
| 2026-10-09 | **Trademark gate (D-033)** | Owner's search for "Breakra" | **No results found.** Gate cleared. Domain `breakra.dev` planned later | Owner report | Which registers were searched was not stated |
| 2026-10-08 | **`bun run metrics` with Alchemy** (owner) | `BASE_RPC_URL=<alchemy> bun run metrics` | ✅ Scanned 52314127–52353241. **5 self-paid Breakra calls** (= V4, V5, V6, cold-agent run, demo check: matches the known count), **0 external**, 22 payments from the owner's other Bankr services. Public RPC fallback still rate-limited; Alchemy recommended | Owner output | — |
| 2026-10-08 | **`bun run metrics` first run** (owner) | `bun run metrics` | **Failed:** `mainnet.base.org` returned `request limit reached` (-32011); the script treated it as a range error, shrank the window and gave up. Fixed: rate limits now back off and retry the same window; publicnode + mainnet.base.org fallback; 250 ms pacing; new test | Owner output | Re-run by the owner |
| 2026-10-08 | **Live demo check on v4** (paid) | Owner: `examples/client.ts demo/github-rest-api/…` | **200**, 59 changes (5 breaking, 35 potentially breaking), **`analysis_id` = local** (`sha256:c17639a1…ddc1`): **engine 0.1.1 is live** | Owner output | — |
| 2026-10-08 | **Redeploy v4** (engine 0.1.1, D-034) | `bun run check` (88/88) then deploy from `main` @ `cc98f7c` (PR #9); `verify-live V0` | ✅ **Live v4**. V0: 402, 20000, router, 60 s; listing links to `SKILL.md` | Owner output | — |
| 2026-10-08 | Reconciliation | Balance reads 21:37 UTC | Burner 24000 → **4000** (−20000, the demo check). Payout 223661 → **243661** (0% fee). Self-paid Breakra calls to date: **5** (V4, V5, V6, cold-agent run, demo check) | On-chain balances (Claude) | — |
| 2026-10-08 | **Phase 5 prep: engine 0.1.1 fixes (D-034)** | `bun run check`; oasdiff oracle; impact run on full GitHub 22→24 diff | 88/88 tests (5 new regression tests fail on 0.1.0). Oracle OK. 35 of 5,909 raw GitHub diffs classified differently (all `$ref` parameters now named; required ones now potentially_breaking). Library console output suppressed (test proves one log line, no spec paths). Bundle 90,997 bytes | Local runs (Claude) | **Live: needs redeploy** |
| 2026-10-08 | **Phase 5 demo and metrics** | `bun run demo`; `tests/docs.test.ts`; `tests/metrics.test.ts` | Demo: 59 changes (5 breaking, 35 potentially breaking), findings spot-checked by hand against the raw specs; `analysis_id sha256:c17639a1…ddc1`. Metrics: 5 tests on a fake chain (payer resolution, RPC range back-off, self-pay separation, continue bar) | Local runs | Metrics against real Base (RPC unreachable from the container) |
| 2026-10-08 | **Phase 4 reconciliation and visibility** | Balance reads 21:13 UTC; GitHub API | Burner 44000 → **24000** (−20000, the cold-agent run only). Payout 203661 → **223661** (+20000, 0% fee). Repo `danbuildss/breakra` is **public**, license detected as **MIT**; `raw.githubusercontent.com/.../skill.md` serves 200 | On-chain balances + GitHub API (Claude) | — |
| 2026-10-08 | **T-405 live cold-agent run** (paid) | Owner: `agent-client.ts` (written from skill.md only) against the live endpoint | **200**, 15 changes, `breaking`, **`analysis_id` = `examples/response.json`** (`sha256:39f62e04…2593`). Server 634 ms. The agent's client checked terms (payTo = router) and signed once. **Phase 4 gate met** | Owner output | — |
| 2026-10-08 | **Redeploy v3** (listing text) | `bun run check` (75/75) then `bankr x402 deploy` from `main` @ `b079a20` (PR #7); `verify-live V0` | ✅ **Live v3**. V0: 402, amount 20000, payTo router, `maxTimeoutSeconds` 60, **listing description now carries the skill.md link**. The matching cold-agent `analysis_id` also proves the v3 build | Owner output | — |
| 2026-10-08 | **Phase 4 cold-agent test** (T-405, mock) | A fresh agent given only `skill.md` wrote `experiments/phase4-cold-agent/agent-client.ts`; Claude reviewed it and ran it against mock Bankr | **200, `analysis_id` = `examples/response.json`** (`sha256:39f62e04…2593`); OpenAPI 2.0 input → free 422. The agent reported 9 gaps in skill.md (biggest: the expected `payTo` was not stated); all fixed | Mock run (Claude) | **Live run by the owner ($0.02)** |
| 2026-10-08 | **Phase 4 docs and examples** | `bun run check`; `tests/docs.test.ts`; `examples/client.ts` against mock Bankr | 75/75 tests (65 + 10 docs tests). Docs tests fail on deliberate drift (skill.md limit, response.json count). Example client: 200 with matching `analysis_id`; 422 not settled; **refused to sign when the mock asked for 30000** | Local runs | Live |
| 2026-10-08 | **Phase 3 v2 reconciliation** | Balance reads 20:55 UTC | Burner 64000 → **44000** (−20000 = V6 only). Payout 183661 → **203661** (+20000, **0% fee**). Phase 3 total: burner −60000 (V4, V5, V6 = $0.06 of the $0.10 cap); 5 of 5 signed attempts used | On-chain balances (Claude) | — |
| 2026-10-08 | **V6 live** largest accepted real pair, 940 KB (paid, v2) | `verify-live V6` | **200**, 290 changes (22 breaking, 86 potentially_breaking, 118 compatible, 64 non_contract). **`analysis_id` = local** (`sha256:16b3d985…3815`). **Server 8,097 ms, client 17,923 ms**: inside the ≤ ~9 s handler target and 12 s of headroom under the 30 s cap | Owner output | Memory on Bankr (not observable) |
| 2026-10-08 | **V0 live** (v2) | `verify-live V0` | 402: exact, eip155:8453, USDC, amount 20000, payTo router `0x8AEE…01a0` | Owner output | — |
| 2026-10-08 | **Redeploy v2** (D-031 limits) | `bun run check` then `bankr x402 deploy breakra-analyze` from `main` @ `4f3c4b1` (PR #5) | check passed (smoke OK, 90,521 bytes). ✅ **Live v2**, $0.02, POST | Owner output | — |
| 2026-10-08 | Price-0 deploy (T11) | Bankr agent deploy | Rejected: `minimum 0.000001` | Live deploy error (relayed) | — |
| 2026-10-08 | Probe rev 1 build (with npm dependency) | Bankr agent deploy ×2 | **Build failed** | Bankr error message; `schema` lookup returns "Endpoint not found" | Cause (logs requested) |
| 2026-10-08 | Probe rev 4 deploy (no dependencies) | Bankr agent deploy; Claude checked `api.bankr.bot/x402/endpoints/schema/<wallet>/breakra-t001-probe` | **Live** v1, $0.001 USDC, base, GET+POST | Public schema API read by Claude | Paid behaviour (T0+) |
| 2026-10-08 | Lib deploy (pre-bundled single file) | Same, `breakra-t001-lib` | **Live** v1, $0.001 USDC, base, GET. **Built first try** | Public schema API read by Claude | Runtime result (T3) |
| 2026-10-08 | Failed builds' logs | Bankr agent | No logs exist: rejected before an endpoint record was created | Relayed by Bankr's agent | Root cause not proven |
| 2026-10-08 | Endpoint deletion | Bankr agent (owner-approved) | Both deleted | `api.bankr.bot/.../schema` → "Endpoint not found" for both (Claude) | — |
| 2026-10-08 | **T3 on lib v2** | `bun t001.ts T3` (19:3x UTC) | **200**, `{"case":"lib","diffs":1,"elapsed_ms":98}` (wall 3740 ms). **Pre-bundled api-smart-diff runs on Bankr.** Charged 1× (burner 25000→24000) | Owner output + Claude balance read 19:36 UTC | v2 source not byte-verified (deployed by Bankr's agent) |
| 2026-10-08 | **On-chain reconciliation** | Owner's Basescan screenshot of burner USDC transfers | 1 IN (0.04 from `0x4456…01F1`) and **15 OUT** `Settle And Split` → `0x8AEE…01a0`, 0.001 each. Mapped by block: T1 412, T2 446, T2r 472, T7 605×2, T8a 648, T8b 673, T8c 703 (08:05:53 UTC), T9a 744, T9b 751, T9c 770, **unlogged 52329220 (about 08:23 UTC)**, T10 52348616, T12 621, T10 695. **No transfer for T3, T4, T5, T6, the T3 retest or the T12 replay.** | Basescan (owner) | Origin of the 08:23 call |
| 2026-10-08 | **T3 retest** lib | `bun t001.ts T3` (19:13 UTC) | **500, empty body** again (1967 ms). **Not charged** (burner 25000 at 19:14). **Unknown whether Bankr redeployed the rev-2 file**; asked the owner | Owner output + balance read | Root cause |
| 2026-10-08 | **Reconciliation** | owner `results.jsonl` + balance reads | Expected charges: T1, T2, T2r, T7×2, T8×3, T9a-c, T10 (19:09), T12, T10 (19:12) = **14** (0.014). Actual burner spend 40000→25000 = **15** (0.015). **One extra charge between 08:08 and 19:10 UTC, unexplained.** | Balance reads | **Owner checking Basescan transfer list** |
| 2026-10-08 | **T10** memory | `bun t001.ts T10` | **200** (3114 ms): 128 MB allocated and touched; RSS **192.9 MB**. Charged 1× (burner 26000→**25000**, 19:12 UTC) | Owner output + Claude balance read | Hard memory ceiling (deliberately not probed) |
| 2026-10-08 | **D-031 limits: local and mock-Bankr check** | `bun run test`, build, mock-Bankr `verify-live` V0–V6 | 65/65. Bundle 90,521 bytes. V0 402; V1 400; V3 422; V4 200 (`analysis_id` match); **V5 2 MB → 413**; **V6 940 KB → 200 (`analysis_id` match), 697 ms locally** | Local runs | Live redeploy and V6 on Bankr |
| 2026-10-08 | **Phase 3 deploy** | `bankr x402 deploy breakra-analyze` (owner; after a write-enabled API key) | ✅ **Live** v1: `https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze`, $0.02, POST. Public schema API listing matches `dist/bankr.x402.json` | Deploy output + `api.bankr.bot/.../schema` (Claude) | — |
| 2026-10-08 | **V0** unpaid | `bun scripts/verify-live.ts V0` | 402: exact, eip155:8453, USDC, **amount 20000** (now verified), payTo router `0x8AEE…01a0` | Owner output | — |
| 2026-10-08 | **V1** invalid JSON (signed) | `verify-live V1` | **400 `INVALID_REQUEST`**, 2.0 s. **Not charged** (burner 104000 unchanged) | Owner output + balance read 20:42 UTC | — |
| 2026-10-08 | **V3** $ref bomb (signed) | `verify-live V3` | **422 `SPEC_TOO_COMPLEX`** (limit 400000), 0.5 s. **Not charged** | Owner output + balance read | — |
| 2026-10-08 | **V4** bake-off fixture (paid) | `verify-live V4` | **200**, 15 changes, `breaking`. **`analysis_id` = local** (`sha256:f5bc256b…755b`). Server 618 ms, client 2.97 s | Owner output | — |
| 2026-10-08 | **V5** largest real pair, 2.03 MB (paid) | `verify-live V5` | **200**, 711 changes (500 listed), `breaking`. **`analysis_id` = local** (`sha256:cb010075…6173`). ⚠️ **Server 16,677 ms** (about 1.7–2 s locally, so about 9× slower on Bankr); **client 26.7 s** end to end against the 30 s gateway cap | Owner output | Memory on Bankr (not observable) |
| 2026-10-08 | **v1 reconciliation** (the plan's original "V6" step) | Balance reads 20:39 → 20:45 UTC | Burner 104000 → **64000** (−40000 = 2 × $0.02). Payout 143661 → **183661** (+40000, **0% fee**). Only V4 and V5 charged | On-chain balances | — |
| 2026-10-08 | **Phase 3 T-302 deploy attempt 1** | `bankr x402 deploy breakra-analyze` (owner, CLI 0.3.45) | **Failed: `API error (413): Payload Too Large`**. The 137 KB unminified upload was rejected; nothing was deployed or charged. Fix: minified build of about 90 KB (D-030) | Owner output | Exact Bankr limit (not documented) |
| 2026-10-08 | **T12** replay | `bun t001.ts T12` | Paid call **200** (1685 ms), then an **identical signed header** resent → **402 `{"error":"Payment already used"}`** (303 ms). **Replay protection verified.** | Owner output | — |
| 2026-10-08 | Balance check 19:10 UTC | Claude balance reads | Burner 29000→**26000** (−3000 since T9: T12 = 1, plus **2 unexplained**: owner asked whether T10/T3 were run). Payout 132661→**141661** (+9000: includes **non-T-001 income**, probably the owner's other endpoints, so payout deltas can't be attributed any more) | Balance reads | Attribution pending the owner's results.jsonl |
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

## Phase 1 results (2026-10-08, local and CI-equivalent run)

| Check | Command | Result |
|---|---|---|
| Install | `bun install --frozen-lockfile` | ✅ |
| Typecheck | `bun run typecheck` | ✅ |
| Lint | `bun run lint` (Biome) | ✅ |
| Unit/integration tests | `bun run test` (Vitest) | ✅ **65/65**: validation and limits (18), rules (34), bake-off and determinism (7), handler and response bounds (6) |
| Build | `bun run build` | ✅ one file, about 137 KB, no imports, literal default export (Phase 1; minified to about 90 KB in Phase 3, D-030) |
| Smoke (built file) | `bun run smoke` on Bun 1.4.2 **and** Bun 1.3.14 | ✅ both |
| Oracle | `bun run oracle` (oasdiff v1.33.0) | ✅ 26 pairs, 21 operation verdicts, 3 documented differences (Breakra stricter) |
| Benchmarks | `bun scripts/bench.ts` | See BENCHMARKS.md. Real 1 MB+1 MB pair about 1.7 s; worst accepted ref bomb about 0.25 s / 156 MB |

**Not tested in Phase 1:**
- anything on Bankr (Phase 3);
- arm64 timing and memory;
- real paid calls at $0.02;
- the GitHub Actions run itself (the workflow will first run on the Phase 1 PR).

## Reporting format
Date | Commit/PR | Command | Result | Evidence | Not tested | Known risks.

No test should claim a real external service or blockchain settlement was exercised unless it actually was.

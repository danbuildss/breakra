# T-001 — Bankr Platform Probe: Deployment and Payment Plan

**Status:** PREPARED, revision 3 (2026-10-08).
**Revision 3 changes:**
- Payout wallet confirmed.
- The payer is a throwaway burner wallet funded from the owner's Rabby wallet, using the test client in `experiments/t001-bankr-probe/client/` (verified against a local mock).
- Bankr's answers recorded (§2).
- The free probe deploys separately.

Original status line follows: PREPARED, revision 2 (2026-10-08). **Not deployed. No USDC spent.** Waiting for the owner's explicit confirmation of §1.
**Approved scope:** preparation only. This is a disposable infrastructure test, not the Breakra endpoint. Max authorized spend is $0.05 USDC.
**Revision 2 changes:**
- **Bankr's agent** hosts and deploys (owner's choice).
- PayBox is no longer assumed as the payer.
- The handling of failed calls is now an **open conflict** (AUDIT §15).
- The timeout test is capped at 25 s.

**Code:** `experiments/t001-bankr-probe/`. It bundles with Bun and all cases pass locally (§6).

---

## 1. Items needing owner confirmation before deploy or payment

| # | Item | Proposed value | Status |
|---|---|---|---|
| 1 | **Bankr account and deployer** | The owner's Bankr account, whose deploying wallet is #2. **Bankr's agent deploys** from the handler source in `experiments/t001-bankr-probe/`. | ✅ Owner chose Bankr's agent |
| 2 | **Payout wallet** | **`0xb98f0de777eea8c481b64e33d3e0066cea38fa91`** | ✅ Owner confirmed (2026-10-08) |
| 3 | **Payer wallet** | Owner's second wallet is Rabby **`0x9E8415109A718de3A4653e4DA37C5906df7C719D`**. Rabby is a browser extension, and a script can't sign with it without exporting its key, which we won't do. **Proposed:** the owner runs `bun t001.ts new-wallet` locally to create a **burner** wallet (its key stays in `.burner-key` on the owner's machine and is never shared). Rabby then sends **0.04 USDC on Base** to the burner, and the burner pays. Rabby is the funding source; the burner is the on-chain payer. | ❓ Owner confirms this approach |
| 4 | **Endpoint names** | `breakra-t001-probe` (paid) and `breakra-t001-free` (price `0`, to test free routes) | Proposed |
| 5 | **Test price** | **$0.001 USDC** per call (Bankr-stated minimum). $0 on the free probe. | Proposed |
| 6 | **Paid requests** | **15 planned**, hard cap **30** | Proposed |
| 7 | **Max spend** | 30 × $0.001 = **$0.030 USDC** in payments, under $0.05 even if every call is charged. The burner needs **no ETH**: the payer only signs, and Bankr says it covers settlement gas. **Extra cost:** one Rabby→burner USDC transfer on Base (Base gas, typically under $0.01, paid by Rabby in ETH). **Leftover:** about $0.01+ may stay in the burner. Sweeping it back would need a little ETH, so it's optional. | Proposed |

**Hard stop rules:**
- Stop at the 30-call cap or $0.05.
- Stop on any charge other than $0.001.
- Stop on any ambiguous payment status.
- Stop if anything asks for a seed phrase or private key.

## 2. Questions to Bankr's agent, and its answers (2026-10-08, input #5)

| Question | Bankr agent's answer | Our status |
|---|---|---|
| Are failed calls charged? | **Yes.** Payment is settled before the handler runs, with no refunds. It says docs that suggest otherwise are "outdated" | ⚠️ Still conflicts with the docs snippets and issue #5. **T4–T6 decide.** |
| Is price 0 allowed? | Not supported. The minimum is $0.001, and price 0 is "likely rejected" | ⚠️ A price-0 listing exists. **T11**, deployed **separately** so a rejection can't block the probe deploy. |
| Can upto settle $0? | Not documented. Don't rely on it | Open. Not tested in T-001. |
| Body limit | Not documented. Treat 6 MB as safe | Matches our plan. T9 measures it. |
| Fee | Not documented. Back-calculate from revenue | Matches our plan (revenue reconciliation). |

The original questions follow.

1. Its brief says handler errors (4xx, 5xx, throw, timeout) are **charged with no refund**. Bankr's docs say payments are *"only collected if your endpoint returns successfully"*. **Which is current?**
2. Is **price `0`** allowed? The marketplace lists `littlefinger-demo` at 0.
3. What is the full payout wallet address?
4. For `paymentScheme: "upto"`, how does a handler report the actual amount to settle? Can it be $0? What fields does `BankrX402Context` have?
5. Is the request body limit 6 MB (Lambda) or 10 MB (API Gateway)?
6. What payload format does `deploy_x402_endpoint` expect: `dependencies` as an array or as an object; schema `properties` as an array or as standard JSON Schema?
7. What is the platform fee percentage, and is there a free tier?

**Corrections to send back to Bankr's agent** (verified, AUDIT §15):
- `api-smart-diff` latest is **1.0.6**; there is no `^3.0.0`.
- The function is `apiCompare`, not `diffSpecs`.
- CLI 0.3.45 has no `x402 logs` or `x402 update` command.

## 3. Irreversible actions and known uncertainties

**Irreversible:**
- On-chain USDC payments.
- Deployed endpoints are public and listed in the Bankr marketplace until deleted. Deletion "cannot be undone". Bankr archives the source on deploy.
- There's no built-in rollback (per the Bankr brief).

**Uncertainties:**
- Whether failures are charged (the core conflict).
- Real body-size and memory limits.
- The fee.
- Whether price 0 works.
- Replay of an identical signed payment can only be tested with option B.
- Claude's container can't reach `x402.bankr.bot`, so Claude can't call the endpoints directly. Claude *can* reach `api.bankr.bot` (discovery, schema, revenue reads).

## 4. Procedure (after confirmation)

0. **Payer setup (owner's machine):** `cd experiments/t001-bankr-probe/client && bun install && bun t001.ts new-wallet`. Send 0.04 USDC on Base from Rabby to the printed burner address.
1. The owner (via Bankr's agent) deploys `breakra-t001-probe` at $0.001, with `api-smart-diff` pinned to **exactly `1.0.6`**. Then, **as a separate deploy**, `breakra-t001-free` at price 0 (T11; a rejection is a valid result).
2. Claude checks the public listing and schema through `api.bankr.bot` and confirms the payout wallet in the URL matches §1 #2.
3. The owner runs the cases in order: `bun t001.ts T0`, then `T1`, … `T12`, one at a time, pasting each output to Claude. Before signing, the client checks that the 402 offers exactly: `exact`, `eip155:8453`, USDC `0x8335…2913`, amount `1000`, payTo = #2. **If any of those is wrong, it aborts without signing.** It signs once per call and never auto-retries (unlike `@x402/fetch`, which can retry with a fresh payment). It refuses to go past 30 paid attempts. Results are appended to `results.jsonl`, which holds no secrets.
4. Reconcile the payer's balance changes against Bankr's revenue figures (requests, total USD, `bankrFeesUsd`).
5. Delete both endpoints. **The owner confirms the deletion first.**
6. Update AUDIT.md, PLAN.md, TASKS.md, DECISIONS.md, TESTING.md (and ARCHITECTURE.md only if needed), tagging every result as **Verified by test / Official docs / Inferred / Unknown**.

## 5. Test cases

| ID | Request | Tests | Bankr brief predicts | Bankr docs predict | Paid calls |
|---|---|---|---|---|---|
| T0 | Unpaid call to `?case=ok` | The 402 challenge | 402, USDC on Base, $0.001, payTo = payout wallet | same | 0 |
| T1 | `?case=ok` | Happy path | 200, charged | 200, charged | 1 |
| T2 | `?case=env` | Runtime and arch, RSS, outbound fetch, forwarded header names (looking for `x-402-payer`) | Bun on arm64, fetch allowed | — | 1 |
| T3 | `?case=lib` | npm dependency bundled (`api-smart-diff` 1.0.6) | works | — | 1 |
| T4 | `?case=bad` (400) | Is a validation failure charged? | **charged** | **not charged** | 1 |
| T5 | `?case=err` (500) | Is a returned 500 charged? | **charged** | **not charged** | 1 |
| T6 | `?case=throw` | Is an unhandled exception charged? | **charged** (500) | **not charged** | 1 |
| T7 | `?case=ok` twice | Retry / duplicate | two charges | two charges | 2 |
| T8 | `?case=sleep&ms=5000`, `15000`, `25000` (stop at first failure; never ≥ 30 s) | Practical timeout headroom | OK under 30 s | — | ≤3 |
| T9 | POST `?case=size` with 100 KB, 1 MB, 4 MB, 6 MB (stop at first rejection) | Body limit. Is a rejected body charged? | ~10 MB | (Lambda: 6 MB) | ≤4 |
| T10 | `?case=mem&mb=128` (only if T2 shows headroom) | Memory | ~128–512 MB | — | ≤1 |
| T11 | `breakra-t001-free` | Is price 0 deployable and free to call? | min $0.001 | listing exists at 0 | 0 |
| T12 | Pay once, then resend the **identical** signed header | Replay protection | 2nd attempt rejected | — | 1 (+1 if the replay is wrongly accepted) |

**Planned paid calls:** 15. **Cap:** 30. **Ceiling:** $0.030.

## 6. Local verification (2026-10-08, no network, no spend)

- **Bundling:** `bun build` succeeds. The probe is 79.1 KB including api-smart-diff 1.0.6; the free probe is 161 B.
- **Local run under Bun 1.4.2:** `ok`→200, `bad`→400, `err`→500, `throw`→throws, `sleep`→200, `size 100 KB`→200, `mem 16 MB`→200, `lib`→200 (1 diff), `env`→200, unknown case→400.
- **Revision 2:** the sleep cap was lowered to 25 s.

This proves only that the handler behaves as designed. **It proves nothing about Bankr.**

**Client verification (rev 3), against a local mock x402 server with a random unfunded key:**
- T0 parsed the 402 (amount `1000`, payTo correct).
- T1 produced an EIP-3009 `TransferWithAuthorization` signature that **viem verified as valid**, paying `1000` to the payout wallet.
- T12 resent the identical header (the mock rejected the replay).
- **A wrong payTo, or an amount of `20000`, aborted with "nothing signed".**
- The mock key was deleted afterwards. `.burner-key` and `results.jsonl` are gitignored.

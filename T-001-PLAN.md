# T-001 — Bankr Platform Probe: Deployment and Payment Plan

**Status:** PREPARED, revision 2 (2026-10-08). **Not deployed. No USDC spent.** Waiting for the owner's explicit confirmation of §1.
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
| 1 | **Bankr account and deployer** | The owner's Bankr account. **Bankr's agent deploys** using its `deploy_x402_endpoint` tool, from the handler source in `experiments/t001-bankr-probe/`. | ❓ Owner confirms the account. |
| 2 | **Payout wallet** | That account's deploying wallet, given in the Bankr brief as **`0xb98f0de...` (truncated)** | ❓ **Owner to give the full address.** |
| 3 | **Payer wallet** | **Must be a different wallet from #2.** Otherwise the payout wallet pays itself, which proves nothing about settlement and may be rejected. Options: **(A)** a second Bankr account paying via `call_x402_endpoint` or `bankr x402 call`; **(B)** the owner runs an x402 client locally with a throwaway wallet (also enables the replay test); **(C)** PayBox `eth1` `0x96753D…e51C` (0 USDC on Base, would need funding). | ❓ **Owner chooses.** Claude recommends A, plus B for the replay case. |
| 4 | **Endpoint names** | `breakra-t001-probe` (paid) and `breakra-t001-free` (price `0`, to test free routes) | Proposed |
| 5 | **Test price** | **$0.001 USDC** per call (Bankr-stated minimum). $0 on the free probe. | Proposed |
| 6 | **Paid requests** | **15 planned**, hard cap **30** | Proposed |
| 7 | **Max spend** | 30 × $0.001 = **$0.030 USDC**, under $0.05 **even if every call, including failures, is charged** (which the Bankr brief claims). Bankr says it covers settlement gas. **Extra cost:** funding the payer wallet, shown before you confirm. | Proposed |

**Hard stop rules:**
- Stop at the 30-call cap or $0.05.
- Stop on any charge other than $0.001.
- Stop on any ambiguous payment status.
- Stop if anything asks for a seed phrase or private key.

## 2. Questions to ask Bankr's agent before deploying

Its answers are recorded, but T-001 still tests them.

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

1. The owner (via Bankr's agent) deploys both services from `experiments/t001-bankr-probe/`, with `api-smart-diff` pinned to **exactly `1.0.6`**.
2. Claude checks the public listing and schema through `api.bankr.bot` and confirms the payout wallet in the URL matches §1 #2.
3. Run the cases in §5 one at a time with the chosen payer, recording each result. Claude prepares the exact call for each case; the owner or payer agent runs it if Claude can't reach the endpoint.
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
| T12 | Replay the identical signed payment header (**option B only**) | Replay protection | rejected | — | 0–1 |

**Planned paid calls:** 15. **Cap:** 30. **Ceiling:** $0.030.

## 6. Local verification (2026-10-08, no network, no spend)

- **Bundling:** `bun build` succeeds. The probe is 79.1 KB including api-smart-diff 1.0.6; the free probe is 161 B.
- **Local run under Bun 1.4.2:** `ok`→200, `bad`→400, `err`→500, `throw`→throws, `sleep`→200, `size 100 KB`→200, `mem 16 MB`→200, `lib`→200 (1 diff), `env`→200, unknown case→400.
- **Revision 2:** the sleep cap was lowered to 25 s.

This proves only that the handler behaves as designed. **It proves nothing about Bankr.**

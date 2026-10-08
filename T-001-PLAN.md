# T-001 — Bankr Platform Probe: Deployment and Payment Plan

**Status:** PREPARED. **Not deployed. No USDC spent.** Waiting for the owner's explicit confirmation of every item in §1.
**Approved scope:** preparation only (owner message 2026-10-08). This is a disposable infrastructure test, not the Breakra endpoint.
**Code:** `experiments/t001-bankr-probe/`. It bundles with Bun (probe 79 KB, free 161 B), and every case was run locally (see §5).

---

## 1. Items needing owner confirmation before anything is deployed or paid

| # | Item | Proposed value | Status |
|---|---|---|---|
| 1 | **Bankr account** | The owner's Bankr account. Claude can't see which account or email it is. | ❓ **Owner to state** which account to use. |
| 2 | **Payout wallet** | The wallet attached to that Bankr account. Bankr pays out to it, and it appears in the endpoint URL `x402.bankr.bot/<wallet>/<service>`. | ❓ **Owner to state** the address. It must **not** be the payer wallet below, so payments show up as real transfers between two wallets. |
| 3 | **Payer wallet** (makes the test payments) | PayBox wallet **`eth1` `0x96753D18312Bd3736ffe86666E7dcc7Bc34ce51C`**, the only wallet granted to this session. Paid via PayBox `pay_x402`. | ⚠️ **Balance on Base is 0 USDC** (read 2026-10-08 07:16 UTC). It needs funding with about **$0.10 USDC on Base**. The connector's approval mode is `autonomous`, but Claude **won't pay anything until you confirm**. No signer is recorded yet, so the first payment will ask you to connect a signing key in the PayBox window. |
| 4 | **Endpoint names** | `breakra-t001-probe` (paid) and `breakra-t001-free` (price `0`, testing whether free routes exist) | Proposed |
| 5 | **Test price** | **$0.001 USDC** per call on `breakra-t001-probe`, the CLI's default minimum. `$0` on the free probe. | Proposed |
| 6 | **Paid requests** | **15 planned**, with a hard cap of **30** (allows for re-running ambiguous cases). The free probe is at most 2 calls at $0. | Proposed |
| 7 | **Max spend** | 30 × $0.001 = **$0.030 USDC** in payments. That's under the $0.05 authorization even if every call is charged. **Known extra costs:** funding the PayBox wallet (an on-ramp fee if bought by card, or about $0.01 of Base gas if transferred from another wallet; shown before you confirm). In x402 "exact" payments the payer signs and the facilitator pays the gas, so there's **no per-call gas for the payer** (inferred from the x402 design; verified during the test). The Bankr fee is reportedly 0% under 1,000 requests/month, charged to the payee. | Proposed |
| 8 | **Deploy credential** | A Bankr API key (from `bankr login` / bankr.bot/api-keys), added by the owner as an environment secret named **`BANKR_API_KEY`** (see §3). **Never paste it into chat.** | ❓ Owner action |

**Hard stop rules:**
- Stop at the 30-call cap or $0.05, whichever comes first.
- Stop immediately if any charge is unexpected (e.g. a charge larger than $0.001, or a charge with no response).
- Stop if any payment status is ambiguous, or if anything asks for a seed phrase or private key.

## 2. Irreversible actions and known uncertainties

**Irreversible:**
- On-chain USDC payments can't be undone.
- `bankr login` accepts Bankr's Terms of Service and creates an API key. You can revoke the key afterwards.
- Deployed services are public at `x402.bankr.bot/<wallet>/<name>` until deleted. Deletion is planned at the end (`bankr x402 delete`), and the CLI says it "cannot be undone". Bankr may still list or index the services briefly.

**Uncertainties:**
- **Network limits on Claude's side:**
  - `x402.bankr.bot` is **blocked from this container**, so Claude can't call the endpoints directly. Paid calls go through **PayBox** (server-side). Unpaid probes (e.g. reading the raw 402) may need the owner to run `curl` locally, or PayBox's quote step.
  - `api.bankr.bot` (deploy, discovery, revenue APIs) **is reachable**.
- Whether PayBox exposes enough detail (settlement tx hash, response headers) to check settlement independently. The fallback is comparing PayBox balances with Bankr's `revenue` API.
- **Replay testing is partial.** True duplicate-authorization replay (resending the same signed payment header) needs a low-level x402 client holding a test key. PayBox signs fresh for every call, so we can test *retries* (two calls give two charges?) but **not** replay of an identical signature, unless the owner runs a local client with a throwaway wallet. That would be recorded as Unknown/blocked.
- The Bankr docs site is blocked from here. Everything about Bankr comes from the CLI source, the public discovery API and secondary reports.
- An open GitHub issue reports blank 500s on paid calls with nothing charged. If we hit it, we document it and stop.

## 3. How deployment would work (after confirmation)

1. **Owner:** create a Bankr API key and add it to this cloud environment's settings (session title bar → environment menu → Edit) under **Network secrets**, or as an environment variable, with the name **`BANKR_API_KEY`**. A new session picks it up. Claude reads only that variable.
2. **Owner:** fund the payer wallet `0x96753D…e51C` with about $0.10 USDC on Base.
3. **Claude:**
   - Run `bankr whoami`.
   - **Stop and show you the account and payout wallet.** You confirm they match §1.
   - Run `bankr x402 deploy` from `experiments/t001-bankr-probe/`.
   - Record the returned URLs and version.
4. **Claude:** run the cases in §4 in order, one at a time, recording each result immediately.
5. **Claude:**
   - Run `bankr x402 revenue breakra-t001-probe` and read the PayBox balances.
   - Reconcile the numbers.
   - Run `bankr x402 delete` on both services. **You confirm the deletion first.**
6. **Claude:** update AUDIT.md, PLAN.md, TASKS.md, DECISIONS.md, TESTING.md (and ARCHITECTURE.md only if needed), tagging every finding as **Verified by test / Official docs / Inferred / Unknown**.

## 4. Test cases and expected outcomes

"Expected" means our current hypothesis. **None of these is assumed to be true.** Each result is recorded as observed.

| ID | Request | What it tests | Hypothesis | Paid calls |
|---|---|---|---|---|
| T0 | Unpaid call to `?case=ok` | The 402 challenge | HTTP 402 with network `eip155:8453`, asset USDC, amount `1000` (0.001 × 10⁶), payTo = your payout wallet | 0 |
| T1 | `?case=ok` | Happy path and settlement | 200, **charged once** (payer −0.001, Bankr revenue +1) | 1 |
| T2 | `?case=env` | Runtime, memory, outbound fetch, forwarded headers | 200. Reveals the runtime (Bun?), RSS, whether `fetch` to example.com works, and which headers Bankr forwards (names only, no values) | 1 |
| T3 | `?case=lib` | Whether npm dependencies get bundled (`api-smart-diff` 1.0.6) | 200, `diffs: 1` | 1 |
| T4 | `?case=bad` | A 400 validation failure | 400. **Not charged?** (the key question) | 1 |
| T5 | `?case=err` | A 500 returned by the handler | 500. **Not charged?** | 1 |
| T6 | `?case=throw` | An unhandled exception | 5xx (possibly a blank 500). **Not charged?** | 1 |
| T7 | `?case=ok`, sent twice back to back | Retries | Two separate payments, **charged twice** (each call is a new authorization). Shows whether Bankr de-duplicates anything | 2 |
| T8 | `?case=sleep&ms=5000`, then `15000`, then `30000`. Stop at the first failure | Handler timeout | Work out the practical timeout. **Check whether a timed-out call is charged.** | ≤3 |
| T9 | POST `?case=size` with 100 KB, 1 MB, 4 MB, 6 MB bodies (stop at the first rejection, never above 6 MB, the common AWS Lambda sync limit) | Max request body | Find the practical limit. **Check whether a rejected body is charged.** | ≤4 |
| T10 | `?case=mem&mb=128` | Memory headroom (only if T2 shows enough) | 200, or an out-of-memory failure. **Charged?** | ≤1 |
| T11 | Free probe `breakra-t001-free` | Do free (price 0) routes exist? (relevant to D-016) | Either 200 without any payment, or the deploy rejects price 0 | 0 |

**Planned paid calls:** 15. **Cap:** 30. **Ceiling:** $0.030.

**Not tested:** replaying an identical signed payment header (§2), and concurrent load of any kind. We won't stress the platform.

## 5. Local verification already done (2026-10-08, no network, no spend)

- **Bundling:** `bun build` of both handlers succeeded. The probe bundle is 79.1 KB (including api-smart-diff); the free probe is 161 B.
- **Local run:** every case passed under Bun 1.4.2 through a local harness:
  - `ok`→200, `bad`→400, `err`→500, `throw`→throws, `sleep 200ms`→200, `size 100 KB`→200 with sha256, `mem 16 MB`→200, `lib`→200 (1 diff), `env`→200, unknown case→400.
  - This proves only that the handler behaves as designed. **It proves nothing about Bankr.**

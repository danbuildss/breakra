# Breakra — Deployment, Verification and Rollback (Bankr x402 Cloud)

Deploy **only** with the Bankr CLI from a clean build (D-025). Never paste or link the handler to Bankr's agent: it truncated and rewrote the file during T-001.
Payout wallet: `0xb98f0de777eea8c481b64e33d3e0066cea38fa91` (the Bankr account that deploys). Buyers pay Bankr's router `0x8AEE…01a0`, which splits each payment to the payout wallet per call (verified in T-001).

## 1. Prerequisites (once, on the deploying machine)

```bash
bun upgrade                 # need Bun >= 1.4.2 (older Bun can't read bun.lock v2)
npm install -g @bankr/cli   # or: bankr update   (need >= 0.3.45)
bankr login                 # API key from bankr.bot/api-keys
```

## 2. Build and test from a known commit

```bash
git fetch origin && git checkout <commit-or-tag>   # e.g. the Phase 3 branch head
git status                                         # must be clean
bun install --frozen-lockfile
bun run check        # typecheck + lint + 65+ tests + build + smoke test of the built file
```

`bun run check` writes:
- `dist/x402/breakra-analyze/index.ts`: one self-contained **minified** file, about 90 KB, no imports (Bankr's deploy API rejected the 137 KB unminified file with 413);
- `dist/bankr.x402.json`: service `breakra-analyze`, price `0.02` USDC on Base, POST only, with description and schema.

## 3. Deploy

```bash
cd dist
bankr x402 deploy breakra-analyze
cd ..
```

Record the printed **URL** and **version** in TESTING.md. The URL should be `https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze`.

## 4. Verify the live endpoint (T-303)

`scripts/verify-live.ts` checks the payment terms before signing (exact, Base USDC, **20000** = $0.02, payTo = Bankr router). It signs once per call, never auto-retries, and stops after 5 signed attempts ($0.10). It uses the T-001 burner key (`experiments/t001-bankr-probe/client/.burner-key`), which never leaves your machine.

Run these **one at a time**, pasting each output to Claude:

```bash
bun scripts/verify-live.ts V0   # free: unpaid → 402 with the right terms
bun scripts/verify-live.ts V1   # invalid JSON → 400, should NOT be charged
bun scripts/verify-live.ts V3   # $ref bomb → 422, should NOT be charged
bun scripts/verify-live.ts V4   # bake-off fixture → 200, $0.02; analysis_id must match the local result
bun scripts/verify-live.ts V5   # largest real pair (~1.9 MB GitHub API) → 200, $0.02; records Bankr timing
```

Expected spend: **$0.04** (V4 + V5). Claude reconciles both wallets' balances on-chain after V5.

## 5. Pause, roll back, remove

| Need | Command | Effect |
|---|---|---|
| Stop sales immediately | `bankr x402 pause breakra-analyze` | New calls are refused; nothing is charged |
| Resume | `bankr x402 resume breakra-analyze` | |
| Roll back | `git checkout <last-good-commit>`, then `bun install --frozen-lockfile && bun run check && cd dist && bankr x402 deploy breakra-analyze` | Bankr has **no built-in version rollback**; redeploying the old build is the rollback, so always deploy from a recorded commit |
| Remove | `bankr x402 delete breakra-analyze` | **Irreversible**; owner approval needed |

After any redeploy, re-run **V0 and V4**. V4 costs $0.02 and proves the deployed build matches the tested code.

## 6. Monitoring

- Bankr dashboard / `bankr x402 list`: request counts and revenue. `bankr x402 revenue breakra-analyze` gives earnings and fees.
- Handler logs: one JSON line per request (`breakra.analyze`: outcome, status, code, bytes, change count, duration, `payer`). They contain no request body and no IP (D-026).

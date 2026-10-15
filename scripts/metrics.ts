/**
 * Phase 5 daily metrics (D-033). Run on the owner's machine (needs a Base RPC; no keys, read-only):
 *   bun run metrics                     # since Breakra went live (2026-10-08)
 *   bun run metrics -- --since 2026-10-15
 * Env: BASE_RPC_URL (recommended: a free Alchemy/QuickNode Base URL; public RPCs rate-limit eth_getLogs.
 *      Default: publicnode, then mainnet.base.org), METRICS_CHUNK (blocks per getLogs, default 10000), METRICS_DELAY_MS (default 250).
 * Paste the output to Claude for docs/project/EXPERIMENT.md, and cross-check with `bankr x402 revenue breakra-analyze`.
 * Attribution: copy scripts/metrics.owner.example.json to .metrics-owner.json (git-ignored; METRICS_OWNER_FILE to
 * override) and fill in your wallets, your other services' prices and Bankr's count. Without it the report is
 * NOT RECONCILED and every non-owner payer is an unconfirmed external wallet.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, fallback, http } from "viem";
import { base } from "viem/chains";
import {
  blockAtOrAfter,
  type ChainReader,
  formatReport,
  type OwnerConfig,
  parseOwnerConfig,
  readPayments,
  summarize,
} from "./lib/metrics";

const args = process.argv.slice(2);
const sinceArg = args.includes("--since") ? args[args.indexOf("--since") + 1] : "2026-10-08";
const since = Date.parse(`${sinceArg}T00:00:00Z`) / 1000;
if (!Number.isFinite(since)) throw new Error(`bad --since date: ${sinceArg} (use YYYY-MM-DD)`);

const ownerFile = process.env.METRICS_OWNER_FILE ?? join(import.meta.dir, "..", ".metrics-owner.json");
const owner: OwnerConfig | null = existsSync(ownerFile)
  ? parseOwnerConfig(JSON.parse(readFileSync(ownerFile, "utf8")))
  : null;
console.error(
  owner ? `owner config: ${ownerFile}` : `no owner config at ${ownerFile}: report will be NOT RECONCILED`,
);

const client = createPublicClient({
  chain: base,
  transport: process.env.BASE_RPC_URL
    ? http(process.env.BASE_RPC_URL, { retryCount: 3, retryDelay: 1_000 })
    : fallback([
        http("https://base-rpc.publicnode.com", { retryCount: 2, retryDelay: 1_000 }),
        http("https://mainnet.base.org", { retryCount: 2, retryDelay: 1_000 }),
      ]),
}) as unknown as ChainReader;

const fromBlock = await blockAtOrAfter(client, since);
console.error(`reading Base from block ${fromBlock} (${sinceArg} 00:00 UTC)…`);
const payments = await readPayments(client, fromBlock, {
  chunk: BigInt(process.env.METRICS_CHUNK ?? "10000"),
  delayMs: Number(process.env.METRICS_DELAY_MS ?? "250"),
  log: (m) => console.error(m),
});
console.log(`Breakra metrics since ${sinceArg} (generated ${new Date().toISOString()})\n`);
console.log(formatReport(summarize(payments, owner, { since: sinceArg })));

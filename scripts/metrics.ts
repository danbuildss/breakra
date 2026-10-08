/**
 * Phase 5 daily metrics (D-033). Run on the owner's machine (needs a Base RPC; no keys, read-only):
 *   bun run metrics                     # since Breakra went live (2026-10-08)
 *   bun run metrics -- --since 2026-10-15
 * Env: BASE_RPC_URL (default https://mainnet.base.org), METRICS_CHUNK (blocks per getLogs, default 10000).
 * Paste the output to Claude for EXPERIMENT.md, and cross-check with `bankr x402 revenue breakra-analyze`.
 */
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { blockAtOrAfter, type ChainReader, formatReport, readPayments, summarize } from "./lib/metrics";

const args = process.argv.slice(2);
const sinceArg = args.includes("--since") ? args[args.indexOf("--since") + 1] : "2026-10-08";
const since = Date.parse(`${sinceArg}T00:00:00Z`) / 1000;
if (!Number.isFinite(since)) throw new Error(`bad --since date: ${sinceArg} (use YYYY-MM-DD)`);

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? "https://mainnet.base.org", { retryCount: 3 }),
}) as unknown as ChainReader;

const fromBlock = await blockAtOrAfter(client, since);
console.error(`reading Base from block ${fromBlock} (${sinceArg} 00:00 UTC)…`);
const payments = await readPayments(client, fromBlock, {
  chunk: BigInt(process.env.METRICS_CHUNK ?? "10000"),
  log: (m) => console.error(m),
});
console.log(`Breakra metrics since ${sinceArg} (generated ${new Date().toISOString()})\n`);
console.log(formatReport(summarize(payments)));

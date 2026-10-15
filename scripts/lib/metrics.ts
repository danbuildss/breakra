/**
 * Phase 5 metrics (D-033): who paid for Breakra, read from Base on-chain data.
 *
 * Each paid call is one transaction: payer → Bankr router (gross USDC), router → payout wallet (net).
 * Breakra calls are recognised by the gross amount (20000 = $0.02). The payout wallet also receives income
 * from the owner's other Bankr services; those are counted separately as "other".
 *
 * On-chain data carries no service id, so attribution is only as good as what the owner declares in a local,
 * git-ignored file (`.metrics-owner.json`, see `scripts/metrics.owner.example.json`):
 *  - `ownerWallets`: every wallet the owner controls or funded. Their payments are self-tests.
 *  - `otherServicePrices`: the gross price (USDC base units) of each of the owner's OTHER Bankr services paid to the
 *    same payout wallet. A $0.02 payment is ambiguous if another service also costs $0.02, and is then never
 *    counted as Breakra.
 *  - `bankr`: Breakra's call count from `bankr x402 revenue breakra-analyze` and the window it covers.
 * Until all three agree with the chain, every non-owner payer is an UNCONFIRMED external wallet and the
 * continue bar is only provisional.
 */
import { decodeEventLog, parseAbiItem } from "viem";

export const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
export const ROUTER = "0x8aee621035d93deb3c0c1177fac252dc2dd501a0";
export const PAYOUT = "0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
export const BREAKRA_GROSS = 20_000n;
/** The owner's own wallets: their payments are self-tests, never external demand. */
export const SELF_WALLETS = [
  "0x250265e8dd7321acfb495c9cf1939dd14ad27a75", // T-001 / verification burner
  PAYOUT,
  "0x9e8415109a718de3a4653e4da37c5906df7c719d", // Rabby
];

export const TRANSFER = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export interface Payment {
  tx: string;
  time: number; // unix seconds
  payer: string; // lowercase
  gross: bigint; // paid by the payer to the router
  net: bigint; // forwarded by the router to the payout wallet
  /** Transfers into the router in this transaction. Anything but 1 means payer and amount can't be attributed. */
  routerTransfers?: number;
}

/** What the owner declares about their wallets and services (`.metrics-owner.json`). */
export interface OwnerConfig {
  ownerWallets?: string[];
  otherServicePrices?: Array<number | string>;
  bankr?: { breakraCalls: number; since: string };
}

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/** Validates a parsed `.metrics-owner.json`. Throws on anything malformed rather than guessing. */
export function parseOwnerConfig(raw: unknown): OwnerConfig {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    throw new Error("owner config: not an object");
  const c = raw as Record<string, unknown>;
  const out: OwnerConfig = {};
  if (c.ownerWallets !== undefined) {
    if (
      !Array.isArray(c.ownerWallets) ||
      !c.ownerWallets.every((a) => typeof a === "string" && ADDRESS.test(a))
    )
      throw new Error("owner config: ownerWallets must be a list of 0x addresses");
    out.ownerWallets = c.ownerWallets as string[];
  }
  if (c.otherServicePrices !== undefined) {
    if (!Array.isArray(c.otherServicePrices) || !c.otherServicePrices.every((v) => /^\d+$/.test(String(v))))
      throw new Error("owner config: otherServicePrices must be USDC base units, e.g. 20000 for $0.02");
    out.otherServicePrices = c.otherServicePrices as Array<number | string>;
  }
  if (c.bankr !== undefined) {
    const b = c.bankr as Record<string, unknown>;
    if (
      !Number.isInteger(b?.breakraCalls) ||
      typeof b?.since !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(b.since)
    )
      throw new Error('owner config: bankr must be { "breakraCalls": <integer>, "since": "YYYY-MM-DD" }');
    out.bankr = { breakraCalls: b.breakraCalls as number, since: b.since };
  }
  return out;
}

type Log = { address: string; topics: readonly string[]; data: string; transactionHash: string | null };

/** The minimal chain client the reader needs (a viem PublicClient satisfies it). */
export interface ChainReader {
  getBlockNumber(): Promise<bigint>;
  getBlock(args: { blockNumber: bigint }): Promise<{ timestamp: bigint }>;
  getLogs(args: {
    address: `0x${string}`;
    event: typeof TRANSFER;
    args: { to: `0x${string}` };
    fromBlock: bigint;
    toBlock: bigint;
  }): Promise<Array<Log & { blockNumber: bigint | null; args: { from?: string; value?: bigint } }>>;
  getTransactionReceipt(args: { hash: `0x${string}` }): Promise<{ logs: Log[] }>;
}

function transfersIn(logs: Log[]): Array<{ from: string; to: string; value: bigint }> {
  const out: Array<{ from: string; to: string; value: bigint }> = [];
  for (const log of logs) {
    if (log.address.toLowerCase() !== USDC) continue;
    try {
      const ev = decodeEventLog({
        abi: [TRANSFER],
        data: log.data as `0x${string}`,
        topics: log.topics as never,
      });
      out.push({ from: ev.args.from.toLowerCase(), to: ev.args.to.toLowerCase(), value: ev.args.value });
    } catch {
      // not a Transfer
    }
  }
  return out;
}

/** First block whose timestamp is >= `time` (binary search). */
export async function blockAtOrAfter(client: ChainReader, time: number): Promise<bigint> {
  let lo = 0n;
  let hi = await client.getBlockNumber();
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    const { timestamp } = await client.getBlock({ blockNumber: mid });
    if (Number(timestamp) < time) lo = mid + 1n;
    else hi = mid;
  }
  return lo;
}

/**
 * Public RPCs throttle (mainnet.base.org: "request limit reached", code -32011). That needs waiting, not a
 * smaller block range; every other getLogs error is treated as a range limit.
 */
export function isRateLimit(err: unknown): boolean {
  const e = err as {
    code?: unknown;
    status?: unknown;
    message?: unknown;
    details?: unknown;
    cause?: unknown;
  };
  const text = `${String(e?.message ?? "")} ${String(e?.details ?? "")} ${String((e?.cause as Error)?.message ?? "")}`;
  return (
    e?.code === -32011 ||
    e?.status === 429 ||
    /rate.?limit|request limit|too many requests|\b429\b/i.test(text)
  );
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Reads every router → payout USDC transfer in [fromBlock, latest] and resolves who paid. */
export async function readPayments(
  client: ChainReader,
  fromBlock: bigint,
  opts: {
    chunk?: bigint;
    log?: (msg: string) => void;
    delayMs?: number; // pause before each getLogs, to stay under public RPC limits
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<Payment[]> {
  const sleep = opts.sleep ?? realSleep;
  const delayMs = opts.delayMs ?? 250;
  const latest = await client.getBlockNumber();
  let chunk = opts.chunk ?? 10_000n;
  let throttled = 0;
  const payments: Payment[] = [];
  const times = new Map<bigint, number>();
  for (let start = fromBlock; start <= latest; ) {
    const end = start + chunk - 1n > latest ? latest : start + chunk - 1n;
    let logs: Awaited<ReturnType<ChainReader["getLogs"]>>;
    await sleep(delayMs);
    try {
      logs = await client.getLogs({
        address: USDC,
        event: TRANSFER,
        args: { to: PAYOUT },
        fromBlock: start,
        toBlock: end,
      });
    } catch (err) {
      if (isRateLimit(err)) {
        if (++throttled > 8) throw err;
        const wait = Math.min(30_000, 1_000 * 2 ** (throttled - 1));
        opts.log?.(`RPC rate limit; waiting ${wait / 1000}s (attempt ${throttled}/8)`);
        await sleep(wait);
        continue; // same window
      }
      if (chunk <= 100n) throw err;
      chunk /= 2n; // RPC range limit: retry the same start with a smaller window
      continue;
    }
    throttled = 0;
    for (const log of logs) {
      if (String(log.args.from ?? "").toLowerCase() !== ROUTER || !log.transactionHash) continue;
      const receipt = await client.getTransactionReceipt({ hash: log.transactionHash as `0x${string}` });
      const intoRouter = transfersIn(receipt.logs).filter((t) => t.to === ROUTER);
      const toRouter = intoRouter[0];
      if (!toRouter) continue;
      const block = log.blockNumber ?? 0n;
      if (!times.has(block))
        times.set(block, Number((await client.getBlock({ blockNumber: block })).timestamp));
      payments.push({
        tx: log.transactionHash,
        time: times.get(block) as number,
        payer: toRouter.from,
        gross: toRouter.value,
        net: log.args.value ?? 0n,
        routerTransfers: intoRouter.length,
      });
    }
    opts.log?.(`scanned blocks ${start}–${end}: ${payments.length} payments so far`);
    start = end + 1n;
  }
  return payments;
}

export interface DayRow {
  date: string;
  externalCalls: number;
  externalWallets: number;
  newWallets: number;
  externalGross: bigint;
  selfCalls: number;
}

export interface Report {
  days: DayRow[];
  totals: {
    externalCalls: number;
    externalWallets: number;
    repeatWallets: number; // external wallets that paid on 2+ different UTC days
    externalGross: bigint;
    externalNet: bigint;
    selfCalls: number;
    otherServiceCalls: number;
    /** $0.02 payments that can't be attributed to Breakra (price collision or multi-payment tx). Never counted. */
    ambiguousCalls: number;
    /** All Breakra calls (self + external): the number Bankr's revenue count must match. */
    breakraCalls: number;
  };
  wallets: Array<{ wallet: string; calls: number; days: number; first: string; last: string }>;
  barMet: boolean; // D-033: >= 3 external wallets, each paying on >= 2 different days
  /** True only when the owner's declarations and Bankr's count agree with the chain (see `issues`). */
  reconciled: boolean;
  /** Why the report is not reconciled; empty when it is. */
  issues: string[];
}

const day = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Pure aggregation of payments into the EXPERIMENT.md daily table. */
export function summarize(
  payments: Payment[],
  config: OwnerConfig | null = null,
  opts: { since?: string; self?: string[] } = {},
): Report {
  const self = [...(opts.self ?? SELF_WALLETS), ...(config?.ownerWallets ?? [])];
  const selfSet = new Set(self.map((a) => a.toLowerCase()));
  const otherPrices = new Set((config?.otherServicePrices ?? []).map((v) => BigInt(v)));
  const priceCollision = otherPrices.has(BREAKRA_GROSS);
  const atPrice = payments.filter((p) => p.gross === BREAKRA_GROSS);
  const ambiguous = atPrice.filter((p) => priceCollision || (p.routerTransfers ?? 1) !== 1);
  const breakra = atPrice.filter((p) => !ambiguous.includes(p));
  const external = breakra.filter((p) => !selfSet.has(p.payer));

  const issues: string[] = [];
  if (!config)
    issues.push(
      "no owner config (.metrics-owner.json): owner wallets and other services' prices are undeclared",
    );
  else {
    if (!config.ownerWallets)
      issues.push("ownerWallets not declared (use [] if there are no other owner wallets)");
    if (!config.otherServicePrices)
      issues.push("otherServicePrices not declared (use [] if no other service pays this payout wallet)");
    if (!config.bankr)
      issues.push("Bankr's Breakra call count not declared (bankr x402 revenue breakra-analyze)");
    else if (opts.since && config.bankr.since !== opts.since)
      issues.push(`Bankr count covers since ${config.bankr.since}, but this run is since ${opts.since}`);
    else if (config.bankr.breakraCalls !== breakra.length)
      issues.push(
        `Bankr reports ${config.bankr.breakraCalls} Breakra calls; the chain shows ${breakra.length}`,
      );
  }
  if (priceCollision)
    issues.push(`another owner service also costs $0.02: ${ambiguous.length} payment(s) can't be attributed`);
  else if (ambiguous.length > 0)
    issues.push(`${ambiguous.length} $0.02 payment(s) share a transaction with other payments`);
  const byDay = new Map<string, DayRow>();
  const seen = new Set<string>();
  const walletDays = new Map<string, { calls: number; days: Set<string> }>();
  for (const p of [...breakra].sort((a, b) => a.time - b.time)) {
    const d = day(p.time);
    const row = byDay.get(d) ?? {
      date: d,
      externalCalls: 0,
      externalWallets: 0,
      newWallets: 0,
      externalGross: 0n,
      selfCalls: 0,
    };
    byDay.set(d, row);
    if (selfSet.has(p.payer)) {
      row.selfCalls++;
      continue;
    }
    row.externalCalls++;
    row.externalGross += p.gross;
    if (!seen.has(p.payer)) {
      seen.add(p.payer);
      row.newWallets++;
    }
    const w = walletDays.get(p.payer) ?? { calls: 0, days: new Set<string>() };
    w.calls++;
    w.days.add(d);
    walletDays.set(p.payer, w);
  }
  for (const row of byDay.values()) {
    row.externalWallets = new Set(external.filter((p) => day(p.time) === row.date).map((p) => p.payer)).size;
  }
  const wallets = [...walletDays.entries()]
    .map(([wallet, w]) => {
      const sorted = [...w.days].sort();
      return {
        wallet: short(wallet),
        calls: w.calls,
        days: w.days.size,
        first: sorted[0] as string,
        last: sorted[sorted.length - 1] as string,
      };
    })
    .sort((a, b) => b.days - a.days || b.calls - a.calls);
  const repeatWallets = wallets.filter((w) => w.days >= 2).length;
  return {
    days: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
    totals: {
      externalCalls: external.length,
      externalWallets: walletDays.size,
      repeatWallets,
      externalGross: external.reduce((s, p) => s + p.gross, 0n),
      externalNet: external.reduce((s, p) => s + p.net, 0n),
      selfCalls: breakra.length - external.length,
      otherServiceCalls: payments.length - atPrice.length,
      ambiguousCalls: ambiguous.length,
      breakraCalls: breakra.length,
    },
    wallets,
    barMet: repeatWallets >= 3,
    reconciled: issues.length === 0,
    issues,
  };
}

const usdc = (v: bigint) => (Number(v) / 1e6).toFixed(2);

export function formatReport(r: Report): string {
  const ext = r.reconciled ? "External" : "Unconfirmed external";
  const lines = [
    r.reconciled
      ? "Status: RECONCILED (owner wallets and other services declared; Bankr's count matches the chain)."
      : `Status: NOT RECONCILED. Every non-owner payer below is an UNCONFIRMED external wallet.\n${r.issues.map((i) => `  - ${i}`).join("\n")}`,
    "",
    `| Date | ${ext} paid calls | ${ext} wallets | New wallets | Gross USDC (${ext.toLowerCase()}) | Self-paid calls |`,
    "|---|---|---|---|---|---|",
    ...r.days.map(
      (d) =>
        `| ${d.date} | ${d.externalCalls} | ${d.externalWallets} | ${d.newWallets} | ${usdc(d.externalGross)} | ${d.selfCalls} |`,
    ),
    "",
    `${ext} paid calls: ${r.totals.externalCalls} from ${r.totals.externalWallets} wallet(s); ${r.totals.repeatWallets} paid on 2+ different days.`,
    `${ext} gross: ${usdc(r.totals.externalGross)} USDC (net to payout ${usdc(r.totals.externalNet)}).`,
    `Breakra calls (self + external, compare with Bankr): ${r.totals.breakraCalls}. Self-paid: ${r.totals.selfCalls}.`,
    `Other services' payments to the payout wallet (not Breakra): ${r.totals.otherServiceCalls}. Ambiguous $0.02 payments (not counted): ${r.totals.ambiguousCalls}.`,
    `Continue bar (>= 3 external wallets paying on 2+ days): ${r.barMet ? "MET" : "not met"}${r.reconciled ? "" : " (PROVISIONAL: not reconciled)"}.`,
    "A wallet is not a person.",
  ];
  if (r.wallets.length > 0) {
    lines.push("", "| Wallet | Calls | Days | First | Last |", "|---|---|---|---|---|");
    for (const w of r.wallets)
      lines.push(`| ${w.wallet} | ${w.calls} | ${w.days} | ${w.first} | ${w.last} |`);
  }
  return lines.join("\n");
}

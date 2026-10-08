/**
 * Phase 5 metrics (D-033): who paid for Breakra, read from Base on-chain data.
 *
 * Each paid call is one transaction: payer → Bankr router (gross USDC), router → payout wallet (net).
 * Breakra calls are recognised by the gross amount (20000 = $0.02). The payout wallet also receives income
 * from the owner's other Bankr services; those are counted separately as "other".
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

/** Reads every router → payout USDC transfer in [fromBlock, latest] and resolves who paid. */
export async function readPayments(
  client: ChainReader,
  fromBlock: bigint,
  opts: { chunk?: bigint; log?: (msg: string) => void } = {},
): Promise<Payment[]> {
  const latest = await client.getBlockNumber();
  let chunk = opts.chunk ?? 10_000n;
  const payments: Payment[] = [];
  const times = new Map<bigint, number>();
  for (let start = fromBlock; start <= latest; ) {
    const end = start + chunk - 1n > latest ? latest : start + chunk - 1n;
    let logs: Awaited<ReturnType<ChainReader["getLogs"]>>;
    try {
      logs = await client.getLogs({
        address: USDC,
        event: TRANSFER,
        args: { to: PAYOUT },
        fromBlock: start,
        toBlock: end,
      });
    } catch (err) {
      if (chunk <= 100n) throw err;
      chunk /= 2n; // RPC range limit: retry the same start with a smaller window
      continue;
    }
    for (const log of logs) {
      if (String(log.args.from ?? "").toLowerCase() !== ROUTER || !log.transactionHash) continue;
      const receipt = await client.getTransactionReceipt({ hash: log.transactionHash as `0x${string}` });
      const toRouter = transfersIn(receipt.logs).find((t) => t.to === ROUTER);
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
  };
  wallets: Array<{ wallet: string; calls: number; days: number; first: string; last: string }>;
  barMet: boolean; // D-033: >= 3 external wallets, each paying on >= 2 different days
}

const day = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Pure aggregation of payments into the EXPERIMENT.md daily table. */
export function summarize(payments: Payment[], self: string[] = SELF_WALLETS): Report {
  const selfSet = new Set(self.map((a) => a.toLowerCase()));
  const breakra = payments.filter((p) => p.gross === BREAKRA_GROSS);
  const external = breakra.filter((p) => !selfSet.has(p.payer));
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
      otherServiceCalls: payments.length - breakra.length,
    },
    wallets,
    barMet: repeatWallets >= 3,
  };
}

const usdc = (v: bigint) => (Number(v) / 1e6).toFixed(2);

export function formatReport(r: Report): string {
  const lines = [
    "| Date | External paid calls | External wallets | New wallets | Gross USDC (external) | Self-paid calls |",
    "|---|---|---|---|---|---|",
    ...r.days.map(
      (d) =>
        `| ${d.date} | ${d.externalCalls} | ${d.externalWallets} | ${d.newWallets} | ${usdc(d.externalGross)} | ${d.selfCalls} |`,
    ),
    "",
    `External paid calls: ${r.totals.externalCalls} from ${r.totals.externalWallets} wallet(s); ${r.totals.repeatWallets} paid on 2+ different days.`,
    `External gross: ${usdc(r.totals.externalGross)} USDC (net to payout ${usdc(r.totals.externalNet)}).`,
    `Self-paid Breakra calls: ${r.totals.selfCalls}. Other services' payments to the payout wallet (not Breakra): ${r.totals.otherServiceCalls}.`,
    `Continue bar (>= 3 external wallets paying on 2+ days): ${r.barMet ? "MET" : "not met"}.`,
  ];
  if (r.wallets.length > 0) {
    lines.push("", "| Wallet | Calls | Days | First | Last |", "|---|---|---|---|---|");
    for (const w of r.wallets)
      lines.push(`| ${w.wallet} | ${w.calls} | ${w.days} | ${w.first} | ${w.last} |`);
  }
  return lines.join("\n");
}

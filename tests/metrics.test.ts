import { encodeAbiParameters, encodeEventTopics } from "viem";
import { describe, expect, it } from "vitest";
import {
  blockAtOrAfter,
  type ChainReader,
  formatReport,
  PAYOUT,
  type Payment,
  ROUTER,
  readPayments,
  SELF_WALLETS,
  summarize,
  TRANSFER,
  USDC,
} from "../scripts/lib/metrics";

const A = "0x1111111111111111111111111111111111111111" as const;
const B = "0x2222222222222222222222222222222222222222" as const;
const C = "0x3333333333333333333333333333333333333333" as const;
const BURNER = SELF_WALLETS[0] as string;
const t = (iso: string) => Date.parse(iso) / 1000;
const pay = (payer: string, iso: string, gross = 20_000n): Payment => ({
  tx: `0x${Math.random().toString(16).slice(2)}`,
  time: t(iso),
  payer,
  gross,
  net: gross,
});

describe("summarize", () => {
  it("separates self-paid, external and other-service payments", () => {
    const r = summarize([
      pay(BURNER, "2026-10-08T20:40:00Z"),
      pay(A, "2026-10-09T10:00:00Z"),
      pay(A, "2026-10-09T11:00:00Z"),
      pay(B, "2026-10-09T12:00:00Z"),
      pay(C, "2026-10-09T13:00:00Z", 1_000n), // another Bankr service of the owner
    ]);
    expect(r.totals).toMatchObject({
      externalCalls: 3,
      externalWallets: 2,
      repeatWallets: 0,
      externalGross: 60_000n,
      selfCalls: 1,
      otherServiceCalls: 1,
    });
    expect(r.days).toEqual([
      {
        date: "2026-10-08",
        externalCalls: 0,
        externalWallets: 0,
        newWallets: 0,
        externalGross: 0n,
        selfCalls: 1,
      },
      {
        date: "2026-10-09",
        externalCalls: 3,
        externalWallets: 2,
        newWallets: 2,
        externalGross: 60_000n,
        selfCalls: 0,
      },
    ]);
    expect(r.barMet).toBe(false);
  });

  it("the continue bar needs 3 external wallets each paying on 2+ different UTC days", () => {
    const twoDays = (w: string) => [pay(w, "2026-10-10T23:59:00Z"), pay(w, "2026-10-11T00:01:00Z")];
    expect(summarize([...twoDays(A), ...twoDays(B)]).barMet).toBe(false);
    const r = summarize([...twoDays(A), ...twoDays(B), ...twoDays(C), ...twoDays(BURNER)]);
    expect(r.totals.repeatWallets).toBe(3);
    expect(r.barMet).toBe(true);
    // Same-day repeats don't count as returning.
    expect(
      summarize([pay(A, "2026-10-10T01:00:00Z"), pay(A, "2026-10-10T22:00:00Z")]).totals.repeatWallets,
    ).toBe(0);
  });

  it("report shows shortened wallets only", () => {
    const text = formatReport(summarize([pay(A, "2026-10-09T10:00:00Z")]));
    expect(text).toContain("0x1111…1111");
    expect(text).not.toContain(A);
  });
});

// A fake chain: settlement transactions as Bankr's router performs them (payer → router → payout).
function transferLog(from: string, to: string, value: bigint, tx: string) {
  return {
    address: USDC,
    topics: encodeEventTopics({
      abi: [TRANSFER],
      eventName: "Transfer",
      args: { from: from as `0x${string}`, to: to as `0x${string}` },
    }) as string[],
    data: encodeAbiParameters([{ type: "uint256" }], [value]),
    transactionHash: tx,
  };
}

function fakeChain(): ChainReader & { calls: number } {
  const txs = [
    { tx: "0xaa", block: 100n, payer: A, gross: 20_000n, net: 20_000n },
    { tx: "0xbb", block: 25_000n, payer: B, gross: 20_000n, net: 19_000n },
  ];
  const chain = {
    calls: 0,
    async getBlockNumber() {
      return 30_000n;
    },
    async getBlock({ blockNumber }: { blockNumber: bigint }) {
      return { timestamp: 1_760_000_000n + blockNumber * 2n };
    },
    async getLogs({ fromBlock, toBlock }: { fromBlock: bigint; toBlock: bigint }) {
      chain.calls++;
      if (toBlock - fromBlock + 1n > 5_000n) throw new Error("block range too large");
      const inRange = txs.filter((x) => x.block >= fromBlock && x.block <= toBlock);
      const unrelated = {
        ...transferLog(C, PAYOUT, 5n, "0xcc"),
        blockNumber: fromBlock,
        args: { from: C, value: 5n },
      };
      return [
        unrelated, // a direct transfer to the payout wallet, not a sale
        ...inRange.map((x) => ({
          ...transferLog(ROUTER, PAYOUT, x.net, x.tx),
          blockNumber: x.block,
          args: { from: ROUTER, value: x.net },
        })),
      ];
    },
    async getTransactionReceipt({ hash }: { hash: string }) {
      const x = txs.find((y) => y.tx === hash);
      if (!x) return { logs: [] };
      return {
        logs: [transferLog(x.payer, ROUTER, x.gross, x.tx), transferLog(ROUTER, PAYOUT, x.net, x.tx)],
      };
    },
  };
  return chain as unknown as ChainReader & { calls: number };
}

describe("readPayments", () => {
  it("resolves payers from settlement receipts and shrinks the window on RPC range errors", async () => {
    const chain = fakeChain();
    const payments = await readPayments(chain, 0n, { chunk: 20_000n, sleep: async () => {} });
    expect(payments.map((p) => [p.tx, p.payer, p.gross, p.net])).toEqual([
      ["0xaa", A, 20_000n, 20_000n],
      ["0xbb", B, 20_000n, 19_000n],
    ]);
    expect(payments[0]?.time).toBe(1_760_000_200);
  });

  it("waits on RPC rate limits without shrinking the window", async () => {
    const chain = fakeChain();
    const inner = chain.getLogs.bind(chain);
    let throttles = 2;
    const ranges: bigint[] = [];
    chain.getLogs = async (args) => {
      if (throttles-- > 0) {
        throw Object.assign(new Error("RPC Request failed."), {
          code: -32011,
          details: "request limit reached",
        });
      }
      ranges.push(args.toBlock - args.fromBlock + 1n);
      return inner(args);
    };
    const waits: number[] = [];
    const payments = await readPayments(chain, 0n, {
      chunk: 5_000n,
      sleep: async (ms) => {
        waits.push(ms);
      },
    });
    expect(payments).toHaveLength(2);
    expect(waits.filter((w) => w >= 1_000)).toEqual([1_000, 2_000]); // backoff, then normal pacing
    expect(new Set(ranges)).toEqual(new Set([5_000n, 1n])); // full windows; the last one is the tail
  });

  it("finds the first block at or after a time", async () => {
    expect(await blockAtOrAfter(fakeChain(), 1_760_000_000 + 2 * 1234)).toBe(1234n);
  });
});

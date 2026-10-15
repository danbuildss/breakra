import { readFileSync } from "node:fs";
import { join } from "node:path";
import { encodeAbiParameters, encodeEventTopics } from "viem";
import { describe, expect, it } from "vitest";
import {
  blockAtOrAfter,
  type ChainReader,
  formatReport,
  PAYOUT,
  type Payment,
  parseOwnerConfig,
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

describe("attribution and reconciliation", () => {
  const OWNER = "0x4444444444444444444444444444444444444444";
  const full = (breakraCalls: number) => ({
    ownerWallets: [OWNER],
    otherServicePrices: [4_000],
    bankr: { breakraCalls, since: "2026-10-08" },
  });

  it("without an owner config every non-owner payer is unconfirmed and the bar is provisional", () => {
    const twoDays = (w: string) => [pay(w, "2026-10-10T10:00:00Z"), pay(w, "2026-10-11T10:00:00Z")];
    const r = summarize([...twoDays(A), ...twoDays(B), ...twoDays(C)]);
    expect(r.barMet).toBe(true);
    expect(r.reconciled).toBe(false);
    const text = formatReport(r);
    expect(text).toContain("NOT RECONCILED");
    expect(text).toContain("Unconfirmed external paid calls: 6");
    expect(text).toContain("MET (PROVISIONAL: not reconciled)");
  });

  it("excludes every declared owner wallet as self-paid", () => {
    const r = summarize([pay(OWNER, "2026-10-09T10:00:00Z"), pay(A, "2026-10-09T11:00:00Z")], full(2), {
      since: "2026-10-08",
    });
    expect(r.totals).toMatchObject({ selfCalls: 1, externalCalls: 1, externalWallets: 1, breakraCalls: 2 });
    expect(r.reconciled).toBe(true);
    expect(formatReport(r)).toContain("Status: RECONCILED");
  });

  it("never counts a $0.02 payment as Breakra when another owner service also costs $0.02", () => {
    const r = summarize(
      [pay(A, "2026-10-09T10:00:00Z"), pay(B, "2026-10-09T11:00:00Z", 4_000n)],
      {
        ...full(0),
        otherServicePrices: [20_000, 4_000],
      },
      { since: "2026-10-08" },
    );
    expect(r.totals).toMatchObject({
      breakraCalls: 0,
      externalCalls: 0,
      ambiguousCalls: 1,
      otherServiceCalls: 1,
    });
    expect(r.reconciled).toBe(false);
    expect(r.issues.join()).toContain("another owner service also costs $0.02");
  });

  it("treats a transaction with several payments into the router as ambiguous", () => {
    const multi = { ...pay(A, "2026-10-09T10:00:00Z"), routerTransfers: 2 };
    const r = summarize([multi], full(0), { since: "2026-10-08" });
    expect(r.totals).toMatchObject({ breakraCalls: 0, ambiguousCalls: 1 });
    expect(r.reconciled).toBe(false);
  });

  it("is not reconciled when Bankr's count or window disagrees, or a declaration is missing", () => {
    const one = [pay(A, "2026-10-09T10:00:00Z")];
    expect(summarize(one, full(2), { since: "2026-10-08" }).issues.join()).toContain("Bankr reports 2");
    expect(summarize(one, full(1), { since: "2026-10-09" }).issues.join()).toContain(
      "covers since 2026-10-08",
    );
    expect(summarize(one, { ownerWallets: [] }, { since: "2026-10-08" }).issues).toHaveLength(2);
    expect(summarize(one, full(1), { since: "2026-10-08" }).reconciled).toBe(true);
  });

  it("rejects malformed owner config instead of guessing", () => {
    expect(() => parseOwnerConfig([])).toThrow();
    expect(() => parseOwnerConfig({ ownerWallets: ["not-an-address"] })).toThrow();
    expect(() => parseOwnerConfig({ otherServicePrices: [0.02] })).toThrow();
    expect(() => parseOwnerConfig({ bankr: { breakraCalls: 3 } })).toThrow();
    expect(parseOwnerConfig({ ownerWallets: [], otherServicePrices: ["20000"] })).toEqual({
      ownerWallets: [],
      otherServicePrices: ["20000"],
    });
  });

  it("the committed example config parses", () => {
    const example = JSON.parse(
      readFileSync(join(__dirname, "../scripts/metrics.owner.example.json"), "utf8"),
    );
    expect(() => parseOwnerConfig(example)).not.toThrow();
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
    expect(payments.map((p) => [p.tx, p.payer, p.gross, p.net, p.routerTransfers])).toEqual([
      ["0xaa", A, 20_000n, 20_000n, 1],
      ["0xbb", B, 20_000n, 19_000n, 1],
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

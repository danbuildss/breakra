/**
 * T-001 test client: run on the OWNER's machine only. Never commit .burner-key or results.
 *
 * Pays with a throwaway "burner" wallet funded with a few cents of USDC from the owner's
 * main wallet. The burner's private key stays in ./.burner-key on this machine.
 *
 * Uses the official x402 SDK for signing, but NOT @x402/fetch's wrapper, which can silently
 * retry with a fresh payment. Here: one signature per call, no auto-retry, and payment
 * requirements are checked BEFORE anything is signed.
 *
 *   bun t001.ts new-wallet     create the burner, print its address only
 *   bun t001.ts <CASE>         run one case (see CASES); results append to ./results.jsonl
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync, chmodSync } from "node:fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";

export const PAYOUT = "0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
const BASE = process.env.T001_BASE ?? `https://x402.bankr.bot/${PAYOUT}`;
const PROBE = `${BASE}/breakra-t001-probe`;
const FREE = `${BASE}/breakra-t001-free`;
const NETWORK = "eip155:8453";
const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const EXPECTED_AMOUNT = process.env.T001_AMOUNT ?? "1000"; // 0.001 USDC (6 decimals)
const MAX_PAID_ATTEMPTS = 30;
const KEY_FILE = ".burner-key";
const RESULTS = process.env.T001_RESULTS ?? "results.jsonl";

type Case = { url: string; method?: string; bytes?: number; paid: boolean; repeat?: number; replay?: boolean };
const q = (c: string) => `${PROBE}?case=${c}`;
export const CASES: Record<string, Case> = {
  T0: { url: q("ok"), paid: false },
  T1: { url: q("ok"), paid: true },
  T2: { url: q("env"), paid: true },
  T3: { url: q("lib"), paid: true },
  T4: { url: q("bad"), paid: true },
  T5: { url: q("err"), paid: true },
  T6: { url: q("throw"), paid: true },
  T7: { url: q("ok"), paid: true, repeat: 2 },
  T8a: { url: q("sleep") + "&ms=5000", paid: true },
  T8b: { url: q("sleep") + "&ms=15000", paid: true },
  T8c: { url: q("sleep") + "&ms=25000", paid: true },
  T9a: { url: q("size"), method: "POST", bytes: 100_000, paid: true },
  T9b: { url: q("size"), method: "POST", bytes: 1_000_000, paid: true },
  T9c: { url: q("size"), method: "POST", bytes: 4_000_000, paid: true },
  T9d: { url: q("size"), method: "POST", bytes: 6_000_000, paid: true },
  T10: { url: q("mem") + "&mb=128", paid: true },
  T11: { url: FREE, paid: false },
  T12: { url: q("ok"), paid: true, replay: true },
};

function paidAttemptsSoFar(): number {
  if (!existsSync(RESULTS)) return 0;
  return readFileSync(RESULTS, "utf8").split("\n").filter(Boolean)
    .map((l) => JSON.parse(l)).reduce((n, r) => n + (r.paid_attempts ?? 0), 0);
}

function record(entry: Record<string, unknown>) {
  appendFileSync(RESULTS, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
  console.log(JSON.stringify(entry, null, 2));
}

async function snapshot(res: Response, started: number) {
  const text = await res.text();
  let settle: unknown = null;
  const h = res.headers.get("PAYMENT-RESPONSE") ?? res.headers.get("X-PAYMENT-RESPONSE");
  if (h) { try { settle = JSON.parse(Buffer.from(h, "base64").toString("utf8")); } catch { settle = "undecodable"; } }
  return { status: res.status, elapsed_ms: Date.now() - started, body: text.slice(0, 600), payment_response: settle,
           header_names: [...res.headers.keys()].sort() };
}

/** Throws unless exactly the agreed requirement is offered. Nothing is signed before this passes. */
export function pickRequirement(pr: { accepts: Array<Record<string, any>> }) {
  const ok = pr.accepts.filter((a) =>
    a.scheme === "exact" && a.network === NETWORK &&
    String(a.asset).toLowerCase() === USDC_BASE &&
    String(a.payTo).toLowerCase() === PAYOUT &&
    String(a.amount ?? a.maxAmountRequired) === EXPECTED_AMOUNT);
  if (ok.length !== 1) throw new Error(`ABORT: unexpected payment requirements, nothing signed: ${JSON.stringify(pr.accepts)}`);
  return ok[0];
}

async function main() {
  const arg = process.argv[2];
  if (arg === "new-wallet") {
    if (existsSync(KEY_FILE)) throw new Error(`${KEY_FILE} already exists; refusing to overwrite`);
    const key = generatePrivateKey();
    writeFileSync(KEY_FILE, key + "\n"); chmodSync(KEY_FILE, 0o600);
    console.log(`Burner address: ${privateKeyToAccount(key).address}\nFund it with ~0.04 USDC on Base. Key saved to ${KEY_FILE} (never share it).`);
    return;
  }
  const c = CASES[arg ?? ""];
  if (!c) throw new Error(`usage: bun t001.ts new-wallet | ${Object.keys(CASES).join(" | ")}`);

  const init = (): RequestInit => ({ method: c.method ?? "GET", body: c.bytes ? new Uint8Array(c.bytes) : undefined });
  let started = Date.now();
  const first = await fetch(c.url, init());
  if (first.status !== 402 || !c.paid) {
    let pr: unknown = null;
    if (first.status === 402) { try { pr = new x402HTTPClient(new x402Client()).getPaymentRequiredResponse((n) => first.headers.get(n)); } catch {} }
    return record({ case: arg, paid_attempts: 0, payment_required: pr, ...(await snapshot(first, started)) });
  }

  const planned = (c.repeat ?? 1) + (c.replay ? 1 : 0);
  if (paidAttemptsSoFar() + planned > MAX_PAID_ATTEMPTS) throw new Error(`ABORT: would exceed ${MAX_PAID_ATTEMPTS} paid attempts`);
  if (!existsSync(KEY_FILE)) throw new Error("no burner wallet; run: bun t001.ts new-wallet");

  const account = privateKeyToAccount(readFileSync(KEY_FILE, "utf8").trim() as `0x${string}`);
  const client = new x402Client().register(NETWORK, new ExactEvmScheme(account));
  const http = new x402HTTPClient(client);
  const pr = http.getPaymentRequiredResponse((n) => first.headers.get(n));
  const chosen = pickRequirement(pr as never);

  const runs = [];
  for (let i = 0; i < (c.repeat ?? 1); i++) {
    const payload = await http.createPaymentPayload({ ...(pr as object), accepts: [chosen] } as never);
    const headers = http.encodePaymentSignatureHeader(payload);
    started = Date.now();
    const res = await fetch(c.url, { ...init(), headers });
    runs.push({ attempt: i + 1, ...(await snapshot(res, started)) });
    if (c.replay) {
      started = Date.now();
      const again = await fetch(c.url, { ...init(), headers }); // identical signed header
      runs.push({ attempt: "replay-of-1", ...(await snapshot(again, started)) });
    }
  }
  record({ case: arg, payer: account.address, paid_attempts: planned, requirement: chosen, runs });
}

if (import.meta.main) main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });

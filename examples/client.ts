/**
 * Minimal Breakra client: compare two OpenAPI 3.0 JSON files and pay $0.02 USDC on Base via x402.
 *
 *   BREAKRA_KEY_FILE=./wallet.key bun examples/client.ts before.json after.json
 *
 * Needs: @x402/core, @x402/evm and viem (tested with 2.28.0 / 2.28.0 / 2.57.4).
 * The key file holds a 0x-prefixed private key for a Base wallet with a little USDC. Use a dedicated
 * low-balance wallet; the key is only used locally to sign one EIP-3009 USDC authorization.
 *
 * Safety rules this client follows (recommended for every Breakra caller):
 *  - It checks the payment terms BEFORE signing: scheme "exact", Base (eip155:8453), USDC, and an
 *    amount no higher than BREAKRA_MAX_ATOMIC (default 20000 = $0.02). Anything else aborts unsigned.
 *  - It signs ONCE per analysis and never re-sends with a new signature automatically. A retry is a new
 *    charge if the first attempt actually succeeded.
 *  - Errors (4xx/5xx) are not charged; only a 200 is.
 */
import { readFileSync } from "node:fs";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const URL =
  process.env.BREAKRA_URL ??
  "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze";
const NETWORK = "eip155:8453";
const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const MAX_ATOMIC = BigInt(process.env.BREAKRA_MAX_ATOMIC ?? "20000");

type Requirement = { scheme: string; network: string; asset: string; amount?: string; payTo: string };
type Finding = { compatibility: string; reason: string; recommended_action: string };
type Result = { compatibility?: string; summary?: Record<string, number>; changes?: Finding[] };

async function main(): Promise<void> {
  const [beforeFile, afterFile] = process.argv.slice(2);
  const keyFile = process.env.BREAKRA_KEY_FILE;
  if (!beforeFile || !afterFile || !keyFile) {
    throw new Error("usage: BREAKRA_KEY_FILE=./wallet.key bun examples/client.ts before.json after.json");
  }
  const body = JSON.stringify({
    before: JSON.parse(readFileSync(beforeFile, "utf8")),
    after: JSON.parse(readFileSync(afterFile, "utf8")),
  });
  const headers = { "content-type": "application/json" };

  // 1. Unpaid request: the endpoint answers 402 with the payment terms.
  const first = await fetch(URL, { method: "POST", headers, body });
  if (first.status !== 402) throw new Error(`expected 402, got ${first.status}: ${await first.text()}`);
  const http = new x402HTTPClient(new x402Client());
  const required = http.getPaymentRequiredResponse((name) => first.headers.get(name));
  const accepts = required.accepts as Requirement[];

  // 2. Check the terms before signing anything.
  const ok = accepts.find(
    (a) =>
      a.scheme === "exact" &&
      a.network === NETWORK &&
      a.asset.toLowerCase() === USDC_BASE &&
      a.amount !== undefined &&
      BigInt(a.amount) <= MAX_ATOMIC,
  );
  if (!ok) throw new Error(`refusing to pay: unexpected terms ${JSON.stringify(accepts)}`);
  console.error(`paying ${Number(ok.amount) / 1e6} USDC on Base to ${ok.payTo}`);

  // 3. Sign once and send the same body with the payment header.
  const account = privateKeyToAccount(readFileSync(keyFile, "utf8").trim() as `0x${string}`);
  const client = new x402HTTPClient(new x402Client().register(NETWORK, new ExactEvmScheme(account)));
  const payload = await client.createPaymentPayload({ ...required, accepts: [ok] } as typeof required);
  const res = await fetch(URL, {
    method: "POST",
    headers: { ...headers, ...client.encodePaymentSignatureHeader(payload) },
    body,
  });
  const result = (await res.json()) as Result;

  // 4. 200 = charged, full result. Anything else = not charged; see result.error.code.
  if (res.status !== 200) {
    console.error(`not charged: HTTP ${res.status}`);
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.error(`compatibility: ${result.compatibility}`, result.summary);
  for (const c of result.changes ?? []) {
    if (c.compatibility === "breaking" || c.compatibility === "potentially_breaking") {
      console.error(`- [${c.compatibility}] ${c.reason}\n  → ${c.recommended_action}`);
    }
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

/**
 * Minimal Breakra client: compare two OpenAPI 3.0 JSON files and pay $0.02 USDC on Base via x402.
 *
 *   BREAKRA_KEY_FILE=./wallet.key bun examples/client.ts before.json after.json
 *
 * Needs: @x402/core, @x402/evm and viem (tested with 2.28.0 / 2.28.0 / 2.57.4).
 * The key file holds a 0x-prefixed private key for a Base wallet with a little USDC. Use a dedicated
 * low-balance wallet; the key is only used locally to sign one EIP-3009 USDC authorization.
 *
 * Safety rules this client follows (recommended for every Breakra caller; the table in SKILL.md):
 *  - It checks the payment terms BEFORE signing: x402 v2, scheme "exact", Base (eip155:8453), USDC, an
 *    amount no higher than BREAKRA_MAX_ATOMIC (default 20000 = $0.02), payTo = Bankr's fee router,
 *    maxTimeoutSeconds of 60 or less, and an EIP-3009 transfer (extra.assetTransferMethod absent or
 *    "eip3009"). Anything else aborts unsigned.
 *  - It signs ONCE per analysis and never re-sends with a new signature automatically. A retry is a new
 *    charge if the first attempt actually succeeded.
 *  - Only Breakra's own JSON error (or an x402 402) means "not charged". A gateway error, a non-JSON
 *    body or a dropped connection means the outcome is UNKNOWN: don't re-sign; wait at least 60 s and
 *    check your wallet's USDC transfers to payTo first.
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
/** Bankr's fee router: the only recipient a Breakra payment may name. */
export const ROUTER = "0x8aee621035d93deb3c0c1177fac252dc2dd501a0";
const MAX_TIMEOUT_SECONDS = 60;
/** Breakra's own error codes (docs/API.md). A JSON body with one of these comes from Breakra itself. */
const BREAKRA_ERRORS = new Set([
  "INVALID_REQUEST",
  "METHOD_NOT_ALLOWED",
  "PAYLOAD_TOO_LARGE",
  "INVALID_SPECIFICATION",
  "UNSUPPORTED_OPENAPI_VERSION",
  "SPEC_TOO_COMPLEX",
  "ANALYSIS_FAILED",
]);

type Requirement = {
  scheme: string;
  network: string;
  asset: string;
  amount?: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  extra?: { assetTransferMethod?: string; [key: string]: unknown };
};
type Finding = { compatibility: string; reason: string; recommended_action: string };
type Result = { compatibility?: string; summary?: Record<string, number>; changes?: Finding[] };

/** The one acceptable payment option, or null: every field in SKILL.md's table must match. */
export function acceptableTerms(
  required: { x402Version?: number; accepts?: Requirement[] },
  maxAtomic: bigint = MAX_ATOMIC,
): Requirement | null {
  if (required.x402Version !== 2) return null;
  return (
    (required.accepts ?? []).find(
      (a) =>
        a.scheme === "exact" &&
        a.network === NETWORK &&
        String(a.asset).toLowerCase() === USDC_BASE &&
        a.amount !== undefined &&
        /^\d+$/.test(a.amount) &&
        BigInt(a.amount) <= maxAtomic &&
        String(a.payTo).toLowerCase() === ROUTER &&
        Number.isInteger(a.maxTimeoutSeconds) &&
        (a.maxTimeoutSeconds as number) > 0 &&
        (a.maxTimeoutSeconds as number) <= MAX_TIMEOUT_SECONDS &&
        (a.extra?.assetTransferMethod === undefined || a.extra.assetTransferMethod === "eip3009"),
    ) ?? null
  );
}

export type Outcome = "charged" | "not_charged" | "unknown";

/**
 * What a response to the PAID request means for your wallet. Only Breakra's own JSON error, or an x402
 * 402 (payment rejected), proves nothing was charged. Anything else (a gateway 502/504 from a proxy, an
 * HTML page, an unparseable body) may come after Bankr already settled: treat it as unknown.
 */
export function paidOutcome(status: number, body: unknown): Outcome {
  const b = body as { status?: unknown; error?: { code?: unknown }; x402Version?: unknown } | null;
  if (status === 200 && b?.status === "success") return "charged";
  if (status === 402 && b?.x402Version === 2) return "not_charged";
  if (status >= 400 && b?.status === "error" && BREAKRA_ERRORS.has(String(b.error?.code)))
    return "not_charged";
  return "unknown";
}

const UNKNOWN_HELP =
  "outcome UNKNOWN: you may have been charged. Do not re-sign. Wait at least 60 s, then check your wallet's USDC transfers to " +
  "0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0 before trying again.";

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

  // 2. Check every term before signing anything.
  const ok = acceptableTerms(required as { x402Version?: number; accepts?: Requirement[] });
  if (!ok) throw new Error(`refusing to pay: unexpected terms ${JSON.stringify(required.accepts)}`);
  console.error(`paying ${Number(ok.amount) / 1e6} USDC on Base to ${ok.payTo}`);

  // 3. Sign once and send the same body with the payment header.
  const account = privateKeyToAccount(readFileSync(keyFile, "utf8").trim() as `0x${string}`);
  const client = new x402HTTPClient(new x402Client().register(NETWORK, new ExactEvmScheme(account)));
  const payload = await client.createPaymentPayload({ ...required, accepts: [ok] } as typeof required);
  let res: Response;
  try {
    res = await fetch(URL, {
      method: "POST",
      headers: { ...headers, ...client.encodePaymentSignatureHeader(payload) },
      body,
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    throw new Error(
      `request failed after signing (${err instanceof Error ? err.message : err}); ${UNKNOWN_HELP}`,
    );
  }
  const text = await res.text();
  let result: Result | null = null;
  try {
    result = JSON.parse(text) as Result;
  } catch {}

  // 4. Only a Breakra success is charged; only Breakra's own error proves it wasn't.
  const outcome = paidOutcome(res.status, result);
  if (outcome !== "charged") {
    console.error(
      outcome === "not_charged" ? `not charged: HTTP ${res.status}` : `HTTP ${res.status}: ${UNKNOWN_HELP}`,
    );
    console.log(result ? JSON.stringify(result, null, 2) : text.slice(0, 500));
    process.exit(1);
  }
  if (!result) throw new Error("unreachable");
  console.error(`compatibility: ${result.compatibility}`, result.summary);
  for (const c of result.changes ?? []) {
    if (c.compatibility === "breaking" || c.compatibility === "potentially_breaking") {
      console.error(`- [${c.compatibility}] ${c.reason}\n  → ${c.recommended_action}`);
    }
  }
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}

/**
 * Phase 3 live verification of the deployed `breakra-analyze` endpoint (T-303). Run on the OWNER's machine.
 *
 * Safety (same design as the T-001 client):
 *  - Payment requirements are checked BEFORE signing: scheme exact, Base, USDC, amount 20000 ($0.02),
 *    payTo = Bankr's fee router (approved D-029). Anything else aborts with nothing signed.
 *  - One signature per call; never auto-retries with a fresh payment (unlike @x402/fetch).
 *  - Hard cap on signed attempts (default 5 × $0.02 = $0.10), counted across runs in the results file.
 *  - The burner key never leaves this machine; it is read from a local file.
 *
 *   bun scripts/verify-live.ts V0          # unpaid 402 check (free)
 *   bun scripts/verify-live.ts V1|V3|V4|V5|V6 # signed calls (V1/V3/V5 should not be charged; V4/V6 cost $0.02 each)
 *
 * Env: VERIFY_URL (default: production URL), VERIFY_KEY_FILE (default: the T-001 burner key),
 *      VERIFY_RESULTS (default .verify-results.jsonl), VERIFY_MAX_ATTEMPTS (default 5).
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { analyze } from "../src/analyze";
import { loadGithubSpec, slice } from "./lib/github-slice";

const root = join(import.meta.dir, "..");
const PAYOUT = "0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
const ROUTER = "0x8aee621035d93deb3c0c1177fac252dc2dd501a0";
const URL_ = process.env.VERIFY_URL ?? `https://x402.bankr.bot/${PAYOUT}/breakra-analyze`;
const KEY_FILE = process.env.VERIFY_KEY_FILE ?? join(root, "experiments/t001-bankr-probe/client/.burner-key");
const RESULTS = process.env.VERIFY_RESULTS ?? join(root, ".verify-results.jsonl");
const MAX_ATTEMPTS = Number(process.env.VERIFY_MAX_ATTEMPTS ?? 5);
const NETWORK = "eip155:8453";
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const AMOUNT = "20000";

const fixture = (n: string) => JSON.parse(readFileSync(join(root, "tests/fixtures/bakeoff", n), "utf8"));

function refBomb(depth: number): Record<string, any> {
  const schemas: Record<string, any> = {};
  for (let i = 0; i < depth; i++) {
    schemas[`S${i}`] = {
      type: "object",
      properties: {
        a: { $ref: `#/components/schemas/S${i + 1}` },
        b: { $ref: `#/components/schemas/S${i + 1}` },
      },
    };
  }
  schemas[`S${depth}`] = { type: "string" };
  return {
    openapi: "3.0.3",
    info: { title: "bomb", version: "1" },
    components: { schemas },
    paths: {
      "/x": {
        get: {
          responses: {
            "200": {
              description: "ok",
              content: { "application/json": { schema: { $ref: "#/components/schemas/S0" } } },
            },
          },
        },
      },
    },
  };
}

type Case = {
  paid: boolean;
  body: () => string;
  expectStatus: number;
  expectCode?: string;
  compareLocal?: boolean;
};
const CASES: Record<string, Case> = {
  V0: {
    paid: false,
    body: () => JSON.stringify({ before: fixture("before.json"), after: fixture("after.json") }),
    expectStatus: 402,
  },
  V1: { paid: true, body: () => "{not json", expectStatus: 400, expectCode: "INVALID_REQUEST" },
  V3: {
    paid: true,
    body: () => JSON.stringify({ before: fixture("before.json"), after: refBomb(30) }),
    expectStatus: 422,
    expectCode: "SPEC_TOO_COMPLEX",
  },
  V4: {
    paid: true,
    body: () => JSON.stringify({ before: fixture("before.json"), after: fixture("after.json") }),
    expectStatus: 200,
    compareLocal: true,
  },
  // ~2 MB real pair: was 200 in 16.7 s on Bankr (v1); since D-031 it exceeds the 1 MB body limit → 413, free.
  V5: {
    paid: true,
    body: () =>
      JSON.stringify({
        before: slice(loadGithubSpec("22.0.0"), 160),
        after: slice(loadGithubSpec("24.0.0"), 160),
      }),
    expectStatus: 413,
    expectCode: "PAYLOAD_TOO_LARGE",
  },
  // Largest real pair under the D-031 limits (50 paths: ~940 KB, ~61k expanded nodes). Measures Bankr timing.
  V6: {
    paid: true,
    body: () =>
      JSON.stringify({
        before: slice(loadGithubSpec("22.0.0"), 50),
        after: slice(loadGithubSpec("24.0.0"), 50),
      }),
    expectStatus: 200,
    compareLocal: true,
  },
};

function attemptsSoFar(): number {
  if (!existsSync(RESULTS)) return 0;
  return readFileSync(RESULTS, "utf8")
    .split("\n")
    .filter(Boolean)
    .reduce((n, l) => n + (JSON.parse(l).signed ? 1 : 0), 0);
}

function record(entry: Record<string, unknown>): void {
  appendFileSync(RESULTS, `${JSON.stringify({ at: new Date().toISOString(), url: URL_, ...entry })}\n`);
  console.log(JSON.stringify(entry, null, 2));
}

export function checkRequirement(pr: { accepts: Array<Record<string, any>> }): Record<string, any> {
  const ok = pr.accepts.filter(
    (a) =>
      a.scheme === "exact" &&
      a.network === NETWORK &&
      String(a.asset).toLowerCase() === USDC &&
      String(a.payTo).toLowerCase() === ROUTER &&
      String(a.amount ?? a.maxAmountRequired) === AMOUNT,
  );
  if (ok.length !== 1)
    throw new Error(`ABORT: unexpected payment requirements, nothing signed: ${JSON.stringify(pr.accepts)}`);
  return ok[0] as Record<string, any>;
}

async function main(): Promise<void> {
  const name = process.argv[2] ?? "";
  const c = CASES[name];
  if (!c) throw new Error(`usage: bun scripts/verify-live.ts ${Object.keys(CASES).join("|")}`);
  const body = c.body();
  const headers = { "content-type": "application/json" };

  const first = await fetch(URL_, { method: "POST", headers, body });
  const http = new x402HTTPClient(new x402Client());
  if (first.status !== 402) {
    return record({
      case: name,
      signed: false,
      status: first.status,
      body: (await first.text()).slice(0, 2000),
      note: "expected 402 first",
    });
  }
  const pr = http.getPaymentRequiredResponse((h) => first.headers.get(h)) as never;
  const requirement = checkRequirement(pr);
  if (!c.paid) {
    return record({ case: name, signed: false, status: 402, pass: true, requirement });
  }

  if (attemptsSoFar() >= MAX_ATTEMPTS)
    throw new Error(`ABORT: spend cap reached (${MAX_ATTEMPTS} signed attempts)`);
  if (!existsSync(KEY_FILE)) throw new Error(`no burner key at ${KEY_FILE}`);
  const account = privateKeyToAccount(readFileSync(KEY_FILE, "utf8").trim() as `0x${string}`);
  const client = new x402HTTPClient(new x402Client().register(NETWORK, new ExactEvmScheme(account)));
  const payload = await client.createPaymentPayload({ ...(pr as object), accepts: [requirement] } as never);

  const started = Date.now();
  const res = await fetch(URL_, {
    method: "POST",
    headers: { ...headers, ...client.encodePaymentSignatureHeader(payload) },
    body,
  });
  const elapsed = Date.now() - started;
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}

  const checks: Record<string, boolean> = { status: res.status === c.expectStatus };
  if (c.expectCode) checks.code = json?.error?.code === c.expectCode;
  let local: string | null = null;
  if (c.compareLocal && json?.analysis_id) {
    const parsed = JSON.parse(body);
    local = (await analyze({ before: parsed.before, after: parsed.after })).analysis_id;
    checks.analysis_id_matches_local = json.analysis_id === local;
  }
  record({
    case: name,
    signed: true,
    payer: account.address,
    request_bytes: body.length,
    status: res.status,
    elapsed_ms: elapsed,
    pass: Object.values(checks).every(Boolean),
    checks,
    summary: json?.summary ?? null,
    compatibility: json?.compatibility ?? null,
    analysis_id: json?.analysis_id ?? null,
    local_analysis_id: local,
    server_duration_ms: json?.metadata?.duration_ms ?? null,
    error: json?.error ?? null,
    response_headers: [...res.headers.keys()].sort(),
    body_if_unparsed: json ? undefined : text.slice(0, 500),
  });
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(String(e?.message ?? e));
    process.exit(1);
  });
}

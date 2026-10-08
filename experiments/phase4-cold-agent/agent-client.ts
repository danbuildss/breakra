#!/usr/bin/env bun
/**
 * Breakra agent client: compare two OpenAPI 3.0 JSON contracts via the paid
 * Breakra endpoint, paying $0.02 USDC on Base with x402 v2 (scheme "exact").
 *
 * Usage:
 *   KEY_FILE=/path/to/key.txt bun agent-client.ts before.json after.json
 *
 * Env:
 *   KEY_FILE     (required) path to a file holding a Base wallet private key (hex).
 *   BREAKRA_URL  (optional) endpoint URL; defaults to the URL in skill.md.
 *
 * Output: the JSON result on stdout, followed by a short human summary on stderr
 * (so stdout stays machine-parseable JSON). Exit code: 0 on a 200 whose
 * compatibility is "compatible"/"non_contract", 2 on a 200 with breaking /
 * potentially_breaking / unknown findings, 1 on any error.
 *
 * Payment safety (from skill.md "Paying (x402)"):
 *  - First request is sent WITHOUT payment; the terms come from the 402.
 *  - Terms are checked before signing: x402Version 2, scheme "exact", network
 *    "eip155:8453", asset = Base USDC, amount <= 20000 (atomic). Anything else is refused.
 *  - Exactly ONE signature per call. No library auto-retry wrapper is used
 *    (no wrapFetchWithPayment); the paid request is sent once by hand.
 *  - A paid request that ends in a network error/timeout is NOT re-signed or
 *    resent, because we cannot know whether it was settled.
 *  - Only ANALYSIS_FAILED (500) triggers a single retry (fresh 402, fresh
 *    signature); errors are never charged, so that retry cannot double-charge.
 */

import { readFileSync, statSync } from "node:fs";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import type { PaymentRequired, PaymentRequirements } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// ---- Constants from skill.md -------------------------------------------------

const DEFAULT_URL =
  "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze";
const EXPECTED_X402_VERSION = 2;
const EXPECTED_SCHEME = "exact";
const EXPECTED_NETWORK = "eip155:8453"; // Base mainnet
const EXPECTED_ASSET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const MAX_AMOUNT = 20000n; // $0.02 in USDC atomic units (6 decimals)
const MAX_BODY_BYTES = 1_000_000; // "1 MB body" (interpreted conservatively as 10^6 bytes)
const REQUEST_TIMEOUT_MS = 60_000; // skill: "Use a timeout of at least 30 s"
const MAX_VALIDITY_SECONDS = 3600; // sanity cap on the authorization lifetime we sign

// ---- Small helpers -----------------------------------------------------------

class FatalError extends Error {}

function die(msg: string): never {
  throw new FatalError(msg);
}

function readJsonObject(path: string, label: string): Record<string, unknown> {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    die(`cannot read ${label} file ${path}: ${(e as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Do not echo file contents (privacy).
    die(`${label} file ${path} is not valid JSON (YAML must be converted to JSON first)`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    die(`${label} file ${path} must contain a JSON object (a whole OpenAPI document)`);
  }
  const doc = parsed as Record<string, unknown>;
  const v = doc.openapi;
  if (typeof v !== "string" || !/^3\.0\.\d+$/.test(v)) {
    // Not fatal locally: the service decides. But warn, since it will be a (free) 422.
    console.error(
      `warning: ${label} has openapi=${JSON.stringify(v)}; Breakra supports only OpenAPI 3.0.x JSON`,
    );
  }
  return doc;
}

function loadPrivateKey(): `0x${string}` {
  const keyFile = process.env.KEY_FILE;
  if (!keyFile) die("KEY_FILE env var is required (path to a file containing the private key)");
  try {
    const st = statSync(keyFile);
    if (!st.isFile()) die(`KEY_FILE ${keyFile} is not a regular file`);
    if (process.platform !== "win32" && (st.mode & 0o077) !== 0) {
      console.error(`warning: KEY_FILE ${keyFile} is readable by group/others; consider chmod 600`);
    }
  } catch (e) {
    if (e instanceof FatalError) throw e;
    die(`cannot stat KEY_FILE: ${(e as Error).message}`);
  }
  let raw: string;
  try {
    raw = readFileSync(keyFile, "utf8").trim();
  } catch (e) {
    die(`cannot read KEY_FILE: ${(e as Error).message}`);
  }
  const hex = raw.startsWith("0x") || raw.startsWith("0X") ? raw.slice(2) : raw;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    // Never print the key or any part of it.
    die("KEY_FILE does not contain a 32-byte hex private key");
  }
  return `0x${hex.toLowerCase()}` as `0x${string}`;
}

function resolveUrl(): string {
  const raw = process.env.BREAKRA_URL?.trim() || DEFAULT_URL;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    die(`BREAKRA_URL is not a valid URL: ${raw}`);
  }
  const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "::1";
  if (u.protocol !== "https:" && !(u.protocol === "http:" && isLocal)) {
    die(`refusing non-HTTPS endpoint ${u.origin} (http is only allowed for localhost)`);
  }
  return u.toString();
}

async function post(
  url: string,
  body: string,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...extraHeaders },
    body,
    redirect: "error", // never follow a redirect with a payment header attached
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function readBody(res: Response): Promise<{ json: unknown; text: string }> {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: undefined, text };
  }
}

function errorCode(json: unknown): string | undefined {
  if (json && typeof json === "object" && "error" in json) {
    const err = (json as { error?: { code?: unknown } }).error;
    if (err && typeof err.code === "string") return err.code;
  }
  return undefined;
}

function describeError(status: number, json: unknown, text: string): string {
  if (json && typeof json === "object" && "error" in json) {
    const err = (json as { error?: { code?: string; message?: string; retryable?: boolean } }).error;
    return `HTTP ${status} ${err?.code ?? ""}: ${err?.message ?? ""}${err?.retryable ? " (retryable)" : ""}`;
  }
  return `HTTP ${status}: ${text.slice(0, 300)}`;
}

// ---- Term checking (skill.md step 2) -----------------------------------------

function termProblems(pr: PaymentRequired, req: PaymentRequirements): string[] {
  const p: string[] = [];
  if (pr.x402Version !== EXPECTED_X402_VERSION) p.push(`x402Version ${pr.x402Version} != 2`);
  if (req.scheme !== EXPECTED_SCHEME) p.push(`scheme ${req.scheme} != exact`);
  if (req.network !== EXPECTED_NETWORK) p.push(`network ${req.network} != ${EXPECTED_NETWORK}`);
  if (typeof req.asset !== "string" || req.asset.toLowerCase() !== EXPECTED_ASSET.toLowerCase()) {
    p.push(`asset ${req.asset} is not Base USDC ${EXPECTED_ASSET}`);
  }
  if (typeof req.amount !== "string" || !/^\d+$/.test(req.amount)) {
    p.push(`amount ${String(req.amount)} is not an integer string`);
  } else {
    const amt = BigInt(req.amount);
    if (amt > MAX_AMOUNT) p.push(`amount ${req.amount} > ${MAX_AMOUNT}`);
    if (amt <= 0n) p.push(`amount ${req.amount} is not positive`);
  }
  if (typeof req.payTo !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(req.payTo)) {
    p.push(`payTo ${String(req.payTo)} is not an EVM address`);
  }
  // skill.md says "Sign one EIP-3009 USDC authorization": refuse Permit2 / other flows.
  const method = (req.extra as Record<string, unknown> | undefined)?.assetTransferMethod;
  if (method !== undefined && method !== "eip3009") {
    p.push(`assetTransferMethod ${String(method)} is not eip3009`);
  }
  if (
    typeof req.maxTimeoutSeconds !== "number" ||
    req.maxTimeoutSeconds <= 0 ||
    req.maxTimeoutSeconds > MAX_VALIDITY_SECONDS
  ) {
    p.push(`maxTimeoutSeconds ${String(req.maxTimeoutSeconds)} outside (0, ${MAX_VALIDITY_SECONDS}]`);
  }
  return p;
}

function pickAcceptableTerms(pr: PaymentRequired): PaymentRequirements {
  const accepts = Array.isArray(pr.accepts) ? pr.accepts : [];
  if (accepts.length === 0) die("402 response offered no payment options");
  const rejected: string[] = [];
  for (const req of accepts) {
    const problems = termProblems(pr, req);
    if (problems.length === 0) return req;
    rejected.push(problems.join("; "));
  }
  die(`refusing to pay: no offered payment terms match the documented terms:\n  - ${rejected.join("\n  - ")}`);
}

// ---- Human summary -----------------------------------------------------------

type Change = {
  id?: string;
  rule?: string;
  compatibility?: string;
  direction?: string;
  operation?: { method?: string; path?: string } | null;
  reason?: string;
  recommended_action?: string;
};

function humanSummary(result: Record<string, unknown>): string {
  const lines: string[] = [];
  const summary = (result.summary ?? {}) as Record<string, number>;
  const changes = (Array.isArray(result.changes) ? result.changes : []) as Change[];
  const limitations = Array.isArray(result.limitations) ? result.limitations : [];
  const metadata = (result.metadata ?? {}) as Record<string, unknown>;

  lines.push(`Breakra verdict: ${String(result.compatibility ?? "?").toUpperCase()}  (${String(result.analysis_id ?? "")})`);
  lines.push(
    `Changes: ${summary.total_changes ?? "?"} total, ${summary.breaking ?? 0} breaking, ` +
      `${summary.potentially_breaking ?? 0} potentially breaking, ${summary.unknown ?? 0} unknown, ` +
      `${summary.compatible ?? 0} compatible, ${summary.non_contract ?? 0} non-contract`,
  );

  const severe = changes.filter(
    (c) => c.compatibility === "breaking" || c.compatibility === "potentially_breaking" || c.compatibility === "unknown",
  );
  const MAX_LISTED = 25;
  for (const c of severe.slice(0, MAX_LISTED)) {
    const op = c.operation ? `${c.operation.method ?? ""} ${c.operation.path ?? ""}`.trim() : "(document)";
    const tag = c.compatibility === "breaking" ? "BREAKING" : c.compatibility === "unknown" ? "UNKNOWN " : "POSSIBLY";
    lines.push(`  [${tag}] ${op} [${c.direction ?? "?"}] ${c.rule ?? ""}`);
    if (c.reason) lines.push(`      why: ${c.reason}`);
    if (c.recommended_action) lines.push(`      fix: ${c.recommended_action}`);
  }
  if (severe.length > MAX_LISTED) lines.push(`  ... and ${severe.length - MAX_LISTED} more (see JSON)`);
  if (severe.length === 0) lines.push("  No breaking, potentially breaking or unknown changes listed.");

  const omitted = Number(metadata.changes_omitted ?? 0);
  if (omitted > 0) lines.push(`Note: ${omitted} change(s) omitted from the list (cap 500); summary counts include them.`);
  if (limitations.length > 0) {
    lines.push(`Limitations (${limitations.length}) - the analysis did not see everything:`);
    for (const l of limitations.slice(0, 10)) lines.push(`  - ${typeof l === "string" ? l : JSON.stringify(l)}`);
  }
  const verdict = result.compatibility;
  if (verdict === "breaking") lines.push("Gate: FAIL (breaking).");
  else if (verdict === "potentially_breaking" || verdict === "unknown")
    lines.push("Gate: FAIL unless a reviewer accepts these findings.");
  else lines.push("Gate: PASS.");
  return lines.join("\n");
}

// ---- Main flow ---------------------------------------------------------------

type Outcome = { kind: "ok"; result: Record<string, unknown> } | { kind: "retry"; message: string };

async function attempt(
  url: string,
  body: string,
  httpClient: x402HTTPClient,
): Promise<Outcome> {
  // Step 1: unpaid request -> expect 402 with terms in the payment-required header.
  let res: Response;
  try {
    res = await post(url, body);
  } catch (e) {
    // No payment header sent: safe to report; nothing was signed.
    die(`unpaid request failed: ${(e as Error).message}`);
  }

  if (res.status !== 402) {
    const { json, text } = await readBody(res);
    if (res.status === 200 && json && typeof json === "object") {
      // Unexpected: served without payment. Accept the result; nothing was signed.
      return { kind: "ok", result: json as Record<string, unknown> };
    }
    if (res.status === 500 && errorCode(json) === "ANALYSIS_FAILED") {
      return { kind: "retry", message: describeError(res.status, json, text) };
    }
    die(`request rejected before payment (not charged): ${describeError(res.status, json, text)}`);
  }

  let paymentRequired: PaymentRequired;
  try {
    paymentRequired = httpClient.getPaymentRequiredResponse((name) => res.headers.get(name));
  } catch (e) {
    die(`402 response had no valid payment-required header: ${(e as Error).message}`);
  }
  await res.body?.cancel().catch(() => {});

  // Step 2: check the terms before signing.
  const terms = pickAcceptableTerms(paymentRequired);
  console.error(
    `Paying ${Number(BigInt(terms.amount)) / 1e6} USDC on Base to ${terms.payTo} (scheme ${terms.scheme})`,
  );

  // Step 3: sign exactly ONE authorization, for exactly the vetted terms only.
  const narrowed: PaymentRequired = { ...paymentRequired, accepts: [terms] };
  const payload = await httpClient.createPaymentPayload(narrowed);
  // Defense in depth: confirm the library signed the terms we vetted.
  const acc = payload.accepted;
  if (
    payload.x402Version !== EXPECTED_X402_VERSION ||
    !acc ||
    acc.scheme !== terms.scheme ||
    acc.network !== terms.network ||
    acc.asset !== terms.asset ||
    acc.amount !== terms.amount ||
    acc.payTo !== terms.payTo
  ) {
    die("internal: signed payload does not match the vetted terms; not sending it");
  }
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(payload);
  if (!("PAYMENT-SIGNATURE" in paymentHeaders)) {
    die("internal: expected a PAYMENT-SIGNATURE header for x402 v2");
  }

  // Resend the SAME body bytes with the signature. Sent once; never resent.
  let paid: Response;
  try {
    paid = await post(url, body, paymentHeaders);
  } catch (e) {
    die(
      `paid request failed in transit (${(e as Error).message}). Payment status is UNKNOWN; ` +
        `not retrying automatically to avoid a double charge. Re-run manually if needed.`,
    );
  }
  const { json, text } = await readBody(paid);

  if (paid.status === 200) {
    if (!json || typeof json !== "object") {
      die("got 200 (you were charged) but the body was not JSON");
    }
    return { kind: "ok", result: json as Record<string, unknown> };
  }
  if (paid.status === 500 && errorCode(json) === "ANALYSIS_FAILED") {
    return { kind: "retry", message: describeError(paid.status, json, text) };
  }
  if (paid.status === 402) {
    let reason = "";
    try {
      reason = httpClient.getPaymentRequiredResponse((n) => paid.headers.get(n)).error ?? "";
    } catch {
      /* ignore */
    }
    die(`payment not accepted (not charged): ${reason || describeError(paid.status, json, text)}`);
  }
  die(`request failed (not charged): ${describeError(paid.status, json, text)}`);
}

async function main(): Promise<number> {
  const [beforePath, afterPath, ...rest] = process.argv.slice(2);
  if (!beforePath || !afterPath || rest.length > 0) {
    console.error("usage: KEY_FILE=<keyfile> [BREAKRA_URL=<url>] bun agent-client.ts <before.json> <after.json>");
    return 1;
  }

  const url = resolveUrl();
  const before = readJsonObject(beforePath, "before");
  const after = readJsonObject(afterPath, "after");
  const body = JSON.stringify({ before, after });
  const size = Buffer.byteLength(body, "utf8");
  if (size > MAX_BODY_BYTES) {
    die(
      `request body is ${size} bytes, over the 1 MB limit; drop unrelated paths from both contracts and compare in parts`,
    );
  }

  const account = privateKeyToAccount(loadPrivateKey());
  // Register ONLY the exact scheme on Base mainnet (no wildcard, no v1 schemes).
  const client = new x402Client();
  client.register(EXPECTED_NETWORK, new ExactEvmScheme(account));
  const httpClient = new x402HTTPClient(client);

  let outcome = await attempt(url, body, httpClient);
  if (outcome.kind === "retry") {
    // skill.md: ANALYSIS_FAILED (500) is the only error worth retrying, once, same input.
    console.error(`${outcome.message}; retrying once (errors are not charged)`);
    outcome = await attempt(url, body, httpClient);
    if (outcome.kind === "retry") die(`analysis failed twice (not charged): ${outcome.message}`);
  }

  const result = outcome.result;
  console.log(JSON.stringify(result, null, 2));
  console.error("\n" + humanSummary(result));

  const verdict = result.compatibility;
  return verdict === "compatible" || verdict === "non_contract" ? 0 : 2;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(`error: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  },
);

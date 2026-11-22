/**
 * breakra.dev/status monitor (D-046). Plain Node 20+, no dependencies: run by .github/workflows/status.yml
 * every 15 minutes. Read-only checks; the hosted API is called WITHOUT payment and must answer 402 with
 * exactly Breakra's terms. Writes status.json (latest run, recent runs, 90 days of daily uptime, npm stats).
 *
 *   node scripts/status-check.mjs [previous.json] [out.json]
 */
import { readFileSync, writeFileSync } from "node:fs";

const LIVE = "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze";
const FORWARD = "https://breakra.dev/api/analyze";
const TERMS = {
  scheme: "exact",
  network: "eip155:8453",
  asset: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  payTo: "0x8aee621035d93deb3c0c1177fac252dc2dd501a0",
  amount: "20000",
};
const TIMEOUT_MS = 15000;
const SLOW_MS = 8000;

async function timed(url, init = {}) {
  const t0 = Date.now();
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": "breakra-status", ...(init.headers ?? {}) },
  });
  return { res, ms: Date.now() - t0 };
}

/** The unpaid request must return 402 with exactly one matching payment requirement. */
async function x402(url) {
  const { res, ms } = await timed(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"before":{},"after":{}}',
  });
  if (res.status !== 402) return { ok: false, ms, detail: `expected 402, got ${res.status}` };
  const header = res.headers.get("payment-required");
  if (!header) return { ok: false, ms, detail: "402 without payment terms" };
  const pr = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  const match = (pr.accepts ?? []).filter(
    (a) =>
      a.scheme === TERMS.scheme &&
      a.network === TERMS.network &&
      String(a.asset).toLowerCase() === TERMS.asset &&
      String(a.payTo).toLowerCase() === TERMS.payTo &&
      String(a.amount ?? a.maxAmountRequired) === TERMS.amount,
  );
  if (match.length !== 1) return { ok: false, ms, detail: "unexpected payment terms" };
  return { ok: true, ms, detail: "402 terms correct: $0.02 USDC · Base · Bankr router" };
}

async function page(url, mustContain) {
  const { res, ms } = await timed(url);
  const text = await res.text();
  if (res.status !== 200) return { ok: false, ms, detail: `HTTP ${res.status}` };
  if (!text.includes(mustContain)) return { ok: false, ms, detail: "unexpected content" };
  return { ok: true, ms, detail: "HTTP 200" };
}

async function agentFiles() {
  const t0 = Date.now();
  const r = await Promise.all([
    page("https://breakra.dev/skill.md", "name: breakra"),
    page("https://breakra.dev/openapi.json", '"openapi"'),
    page("https://breakra.dev/llms.txt", "# Breakra"),
  ]);
  const bad = ["skill.md", "openapi.json", "llms.txt"].filter((_, i) => !r[i].ok);
  return {
    ok: bad.length === 0,
    ms: Date.now() - t0,
    detail: bad.length ? `failing: ${bad.join(", ")}` : "all 3 served",
  };
}

async function npm() {
  const { res, ms } = await timed("https://registry.npmjs.org/breakra/latest");
  if (res.status !== 200) return { ok: false, ms, detail: `HTTP ${res.status}` };
  const v = (await res.json()).version;
  return { ok: Boolean(v), ms, detail: `latest ${v}`, version: v };
}

async function mcpRegistry() {
  const { res, ms } = await timed(
    "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.danbuildss/breakra",
  );
  if (res.status !== 200) return { ok: false, ms, detail: `HTTP ${res.status}` };
  const body = await res.json();
  const found = JSON.stringify(body).includes("io.github.danbuildss/breakra");
  return { ok: found, ms, detail: found ? "listed: io.github.danbuildss/breakra" : "not found" };
}

export const SERVICES = [
  { id: "hosted-api", name: "Hosted API (Bankr x402)", run: () => x402(LIVE) },
  { id: "api-forward", name: "breakra.dev/api/analyze", run: () => x402(FORWARD) },
  { id: "website", name: "Website (breakra.dev)", run: () => page("https://breakra.dev/", "breakra") },
  { id: "agent-files", name: "Agent files (skill.md · openapi.json · llms.txt)", run: agentFiles },
  { id: "npm", name: "npm package (breakra)", run: npm },
  { id: "mcp-registry", name: "MCP Registry listing", run: mcpRegistry },
];

async function npmDownloads() {
  try {
    const { res } = await timed("https://api.npmjs.org/downloads/point/last-week/breakra");
    if (res.status !== 200) return null;
    return (await res.json()).downloads ?? null;
  } catch {
    return null;
  }
}

export async function runChecks() {
  const results = {};
  await Promise.all(
    SERVICES.map(async (s) => {
      try {
        const r = await s.run();
        results[s.id] = { ...r, slow: r.ok && r.ms > SLOW_MS };
      } catch (err) {
        results[s.id] = {
          ok: false,
          ms: null,
          detail: err?.name === "TimeoutError" ? "timed out" : "request failed",
        };
      }
    }),
  );
  return results;
}

/** Folds one run into the stored document: latest, the last 24 runs, and 90 days of daily [ok, total]. */
export function fold(prev, t, results, downloads) {
  const doc = prev && prev.version === 1 ? prev : { version: 1, services: {}, recent: [], daily: {} };
  doc.services = Object.fromEntries(SERVICES.map((s) => [s.id, s.name]));
  doc.latest = { t, results };
  doc.recent = [
    { t, ok: Object.values(results).filter((r) => r.ok).length, total: SERVICES.length },
    ...doc.recent,
  ].slice(0, 24);
  const day = t.slice(0, 10);
  doc.daily[day] ??= {};
  for (const s of SERVICES) {
    const [ok, total] = doc.daily[day][s.id] ?? [0, 0];
    doc.daily[day][s.id] = [ok + (results[s.id]?.ok ? 1 : 0), total + 1];
  }
  for (const d of Object.keys(doc.daily).sort().slice(0, -90)) delete doc.daily[d];
  doc.stats = {
    npm_downloads_last_week: downloads,
    npm_latest: results.npm?.version ?? doc.stats?.npm_latest ?? null,
  };
  doc.started ??= day;
  return doc;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [prevPath, outPath = "status.json"] = process.argv.slice(2);
  let prev = null;
  try {
    prev = prevPath ? JSON.parse(readFileSync(prevPath, "utf8")) : null;
  } catch {}
  const t = new Date().toISOString();
  const [results, downloads] = await Promise.all([runChecks(), npmDownloads()]);
  writeFileSync(outPath, `${JSON.stringify(fold(prev, t, results, downloads))}\n`);
  for (const s of SERVICES)
    console.log(
      `${results[s.id].ok ? "OK  " : "FAIL"} ${s.name}: ${results[s.id].detail} (${results[s.id].ms} ms)`,
    );
  console.log(`npm downloads last week: ${downloads}`);
}

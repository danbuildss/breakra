/**
 * T-001 DISPOSABLE Bankr platform probe. NOT the Breakra product.
 * No business logic, no secrets, no logging of request bodies.
 * Select a case with ?case=<name>. See T-001-PLAN.md for expected outcomes.
 */
import { apiCompare } from "api-smart-diff";

const MAX_SLEEP_MS = 30_000;
const MAX_ALLOC_MB = 256;

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async function handler(req: Request): Promise<Response> {
  const started = Date.now();
  const url = new URL(req.url);
  const testCase = url.searchParams.get("case") ?? "ok";

  switch (testCase) {
    case "ok":
      return Response.json({ case: "ok", ok: true });

    case "bad":
      return Response.json({ case: "bad", error: "simulated validation failure" }, { status: 400 });

    case "err":
      return Response.json({ case: "err", error: "simulated server error" }, { status: 500 });

    case "throw":
      throw new Error("T-001 simulated exception");

    case "sleep": {
      const ms = Math.min(Number(url.searchParams.get("ms") ?? 0) || 0, MAX_SLEEP_MS);
      await new Promise((r) => setTimeout(r, ms));
      return Response.json({ case: "sleep", requested_ms: ms, elapsed_ms: Date.now() - started });
    }

    case "size": {
      const body = await req.arrayBuffer();
      return Response.json({ case: "size", bytes: body.byteLength, sha256: await sha256Hex(body) });
    }

    case "mem": {
      const mb = Math.min(Number(url.searchParams.get("mb") ?? 0) || 0, MAX_ALLOC_MB);
      const buf = new Uint8Array(mb * 1024 * 1024).fill(1);
      return Response.json({ case: "mem", allocated_mb: mb, touched: buf[buf.length - 1] ?? null, rss: process.memoryUsage().rss });
    }

    case "lib": {
      const spec = (extra: Record<string, unknown>) => ({
        openapi: "3.0.3",
        info: { title: "t", version: "1" },
        paths: { "/a": { get: { responses: { "200": { description: "ok" } } } }, ...extra },
      });
      const r = apiCompare(spec({}), spec({ "/b": { get: { responses: { "200": { description: "ok" } } } } }));
      return Response.json({ case: "lib", diffs: r.diffs.length, elapsed_ms: Date.now() - started });
    }

    case "env": {
      let outbound: string;
      try {
        const res = await fetch("https://example.com/", { signal: AbortSignal.timeout(3000) });
        outbound = `status ${res.status}`;
      } catch (e) {
        outbound = `error ${(e as Error).name}`;
      }
      return Response.json({
        case: "env",
        runtime: typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ? "bun" : "other",
        versions: process.versions,
        platform: process.platform,
        arch: process.arch,
        rss: process.memoryUsage().rss,
        env_var_count: Object.keys(process.env).length, // names and values deliberately not returned
        request_header_names: [...req.headers.keys()].sort(),
        outbound_fetch: outbound,
      });
    }

    default:
      return Response.json({ error: "unknown case" }, { status: 400 });
  }
}

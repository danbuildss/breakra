# Message to send to Bankr's agent (T-001)

Copy everything below the line to Bankr's agent.

---

Please deploy two **disposable test endpoints** from my wallet `0xb98f0de777eea8c481b64e33d3e0066cea38fa91`. They're an infrastructure test, not a product. Deploy them **as two separate deployments**, so that if the second is rejected the first still goes live.

### Deployment 1: `breakra-t001-probe`
- price: `"0.001"` USDC on Base, scheme `exact`
- methods: allow **GET and POST** (the test sends GET for most cases and POST for body-size cases)
- description: `DISPOSABLE T-001 platform probe. Not a product. Do not use.`
- dependencies: `api-smart-diff` **exactly `1.0.6`**, not `^3.0.0` (no 3.x exists) and not a range
- no env vars, no fileAccess, no appKVAccess
- source (`index.ts`, use exactly as written):

```ts
/**
 * T-001 DISPOSABLE Bankr platform probe. NOT the Breakra product.
 * No business logic, no secrets, no logging of request bodies.
 * Select a case with ?case=<name>. See T-001-PLAN.md for expected outcomes.
 */
import { apiCompare } from "api-smart-diff";

const MAX_SLEEP_MS = 25_000; // stay under Bankr's stated 30 s gateway cap
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
```

### Deployment 2: `breakra-t001-free`
- price: `"0"`. **We're testing whether a free route is possible.** If the platform rejects price 0, don't substitute another price. Just tell me the exact rejection message.
- methods: GET
- description: `DISPOSABLE T-001 probe: free-route test. Not a product.`
- source:

```ts
/**
 * T-001 DISPOSABLE probe: is a price-0 (free) Bankr service possible?
 * NOT the Breakra product.
 */
export default async function handler(_req: Request): Promise<Response> {
  return Response.json({ case: "free", ok: true });
}
```

### Please reply with
1. Each deployment's exact URL and version number, or the exact error message.
2. The price and network each endpoint is actually configured with.
3. Confirmation that the payout wallet is `0xb98f0de777eea8c481b64e33d3e0066cea38fa91`.

**Please don't call the endpoints yourself.** Test calls will come from a separate wallet so payments can be traced.

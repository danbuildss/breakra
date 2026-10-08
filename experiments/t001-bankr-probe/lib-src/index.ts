/**
 * Source for breakra-t001-lib. Bundled (with api-smart-diff 1.0.6 inlined) into
 * x402/breakra-t001-lib/index.ts by build.sh, so Bankr installs NO dependencies.
 * This mirrors how the real Breakra handler will ship (D-015).
 */
import { apiCompare } from "api-smart-diff";

export default async function handler(_req: Request): Promise<Response> {
  const started = Date.now();
  const spec = (extra: Record<string, unknown>) => ({
    openapi: "3.0.3",
    info: { title: "t", version: "1" },
    paths: { "/a": { get: { responses: { "200": { description: "ok" } } } }, ...extra },
  });
  const r = apiCompare(spec({}), spec({ "/b": { get: { responses: { "200": { description: "ok" } } } } }));
  return Response.json({ case: "lib", diffs: r.diffs.length, elapsed_ms: Date.now() - started });
}

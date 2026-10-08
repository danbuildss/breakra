/** Runs the BUILT single-file handler under Bun: the same artefact that would be deployed. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const file = join(root, "dist/x402/breakra-analyze/index.ts");
const source = readFileSync(file, "utf8");
const fail = (msg: string): never => {
  console.error(`SMOKE FAIL: ${msg}`);
  process.exit(1);
};
const codeOnly = source.replace(/^\/\/.*$/gm, "");
if (/(^|[;}\s])import[\s{(]/.test(codeOnly)) fail("bundle contains import statements");
// Bankr's deploy API rejected a 137 KB upload with 413; keep a margin under ~100 KB.
if (source.length > 95_000) fail(`bundle is ${source.length} bytes; too large for Bankr's deploy API`);
if (
  !/export default async function handler\(req: Request\): Promise<Response> \{\s*return [A-Za-z_$][\w$]*\(req\);\s*\}\s*$/.test(
    source,
  )
) {
  fail("bundle does not end with the literal default-function export");
}
const { default: handler } = await import(file);
const fixture = (name: string) =>
  JSON.parse(readFileSync(join(root, "tests/fixtures/bakeoff", name), "utf8"));

const ok = await handler(
  new Request("https://smoke/", {
    method: "POST",
    body: JSON.stringify({ before: fixture("before.json"), after: fixture("after.json") }),
  }),
);
const body = await ok.json();
if (
  ok.status !== 200 ||
  body.status !== "success" ||
  body.summary.total_changes !== 15 ||
  body.compatibility !== "breaking"
) {
  fail(`happy path: status ${ok.status} ${JSON.stringify(body).slice(0, 300)}`);
}
const bad = await handler(new Request("https://smoke/", { method: "POST", body: "{not json" }));
if (bad.status !== 400) fail(`invalid JSON should be 400, got ${bad.status}`);
const get = await handler(new Request("https://smoke/", { method: "GET" }));
if (get.status !== 405) fail(`GET should be 405, got ${get.status}`);
console.log(
  `smoke OK: ${source.length} bytes, ${body.summary.total_changes} changes, overall ${body.compatibility}`,
);

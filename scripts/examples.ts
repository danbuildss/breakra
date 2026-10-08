/**
 * Regenerates examples/response.json from examples/request.json with the current engine.
 * duration_ms is pinned to 0 so the file is deterministic; tests/docs.test.ts fails if it drifts.
 *   bun run examples
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../src/analyze";

// import.meta.url (not import.meta.dir) so tests can import this under Node/Vitest too.
const root = fileURLToPath(new URL("..", import.meta.url));

export async function exampleResponse(): Promise<unknown> {
  const request = JSON.parse(readFileSync(join(root, "examples/request.json"), "utf8"));
  return analyze({ before: request.before, after: request.after }, () => 0);
}

if (import.meta.main) {
  const out = join(root, "examples/response.json");
  writeFileSync(out, `${JSON.stringify(await exampleResponse(), null, 2)}\n`);
  console.log(`wrote ${out}`);
}

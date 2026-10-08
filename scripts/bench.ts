/**
 * T-108 benchmark (manual; not run in CI). Measures analysis time, memory and expanded size on
 * slices of GitHub's real OpenAPI spec (two published versions) at increasing sizes, so LIMITS can be
 * calibrated against real-world documents.
 *
 *   bun scripts/bench.ts            # downloads @octokit/openapi v22.0.0 and v24.0.0 into .bench/ on first run
 */
import { analyze } from "../src/analyze";
import { LIMITS } from "../src/core/limits";
import { expandedSize } from "../src/core/validate";
import { loadGithubSpec, slice } from "./lib/github-slice";

const before = loadGithubSpec("22.0.0");
const after = loadGithubSpec("24.0.0");
console.log(`maxExpandedNodes = ${LIMITS.maxExpandedNodes}`);
console.log("paths | before KB | after KB | expanded nodes (max of both) | ms | RSS MB | changes | result");
for (const n of [10, 40, 80, 120, 160, 200]) {
  const b = slice(before, n);
  const a = slice(after, n);
  const kb = (x: unknown) => Math.round(JSON.stringify(x).length / 1024);
  let expanded = "-";
  try {
    expanded = String(Math.max(expandedSize(b, "before"), expandedSize(a, "after")));
  } catch {
    expanded = `> ${LIMITS.maxExpandedNodes}`;
  }
  Bun.gc(true);
  const t = performance.now();
  let outcome: string;
  let changes = "-";
  try {
    const r = await analyze({ before: b, after: a });
    outcome = r.compatibility;
    changes = String(r.summary.total_changes);
  } catch (e: any) {
    outcome = e.code ?? e.name;
  }
  const ms = Math.round(performance.now() - t);
  console.log(
    `${n} | ${kb(b)} | ${kb(a)} | ${expanded} | ${ms} | ${Math.round(process.memoryUsage().rss / 1e6)} | ${changes} | ${outcome}`,
  );
}

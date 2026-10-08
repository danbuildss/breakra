/**
 * Independent cross-check (D-013): runs oasdiff on every case in tests/oracle-cases.ts plus the bake-off
 * fixture and compares, per operation, whether each tool flags a risky change:
 *   Breakra: breaking | potentially_breaking      oasdiff: level >= 2 (WARN or ERR)
 * Any disagreement must be listed with a reason in tests/oracle-differences.json, or the run fails.
 * Requires the `oasdiff` binary (pinned in CI) or OASDIFF=/path/to/oasdiff.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyze } from "../src/analyze";
import { ORACLE_CASES, type OracleCase } from "../tests/oracle-cases";

const root = join(import.meta.dir, "..");
const bin = process.env.OASDIFF ?? "oasdiff";
const allow: Array<{ case: string; operation: string; flaggedBy: "breakra" | "oasdiff"; reason: string }> =
  JSON.parse(readFileSync(join(root, "tests/oracle-differences.json"), "utf8"));

const load = (n: string) => JSON.parse(readFileSync(join(root, "tests/fixtures/bakeoff", n), "utf8"));
const cases: OracleCase[] = [
  { name: "bakeoff-14", before: load("before.json"), after: load("after.json") },
  ...ORACLE_CASES,
];

const dir = mkdtempSync(join(tmpdir(), "breakra-oracle-"));
const problems: string[] = [];
const seenAllow = new Set<string>();
let compared = 0;

for (const c of cases) {
  const b = join(dir, `${c.name}-before.json`);
  const a = join(dir, `${c.name}-after.json`);
  writeFileSync(b, JSON.stringify(c.before));
  writeFileSync(a, JSON.stringify(c.after));
  const run = spawnSync(bin, ["changelog", b, a, "--format", "json"], { encoding: "utf8" });
  if (run.status !== 0) {
    console.error(`oasdiff failed on ${c.name}: ${run.stderr}`);
    process.exit(2);
  }
  const items: Array<{ level: number; operation?: string; path?: string; id: string }> = JSON.parse(
    run.stdout || "[]",
  );
  const theirs = new Set(
    items.filter((i) => i.level >= 2).map((i) => (i.operation ? `${i.operation} ${i.path}` : "*")),
  );
  const result = await analyze({ before: c.before, after: c.after });
  const ours = new Set(
    result.changes
      .filter((ch) => ch.compatibility === "breaking" || ch.compatibility === "potentially_breaking")
      .map((ch) => (ch.operation ? `${ch.operation.method} ${ch.operation.path}` : "*")),
  );
  for (const op of new Set([...theirs, ...ours])) {
    compared += 1;
    if (theirs.has(op) === ours.has(op)) continue;
    const flaggedBy = ours.has(op) ? "breakra" : "oasdiff";
    const entry = allow.find((x) => x.case === c.name && x.operation === op && x.flaggedBy === flaggedBy);
    if (entry) {
      seenAllow.add(`${entry.case}|${entry.operation}|${entry.flaggedBy}`);
    } else {
      const detail =
        flaggedBy === "oasdiff"
          ? items
              .filter((i) => i.level >= 2 && (i.operation ? `${i.operation} ${i.path}` : "*") === op)
              .map((i) => i.id)
          : result.changes
              .filter((ch) => (ch.operation ? `${ch.operation.method} ${ch.operation.path}` : "*") === op)
              .map((ch) => ch.rule);
      problems.push(`${c.name}: ${op} flagged only by ${flaggedBy} (${detail.join(", ")})`);
    }
  }
}
for (const x of allow) {
  if (!seenAllow.has(`${x.case}|${x.operation}|${x.flaggedBy}`))
    problems.push(`stale allowlist entry: ${x.case} ${x.operation} (${x.flaggedBy})`);
}
console.log(
  `oracle: ${cases.length} pairs, ${compared} operation verdicts compared, ${seenAllow.size} documented differences`,
);
if (problems.length) {
  console.error(`UNDOCUMENTED DIFFERENCES:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("oracle OK");

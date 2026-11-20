/**
 * Breakra benchmark (roadmap PR D). Two parts:
 *  1. Real API history: consecutive versions of GitHub's REST API description (@octokit/openapi on npm, MIT) and
 *     Stripe's OpenAPI spec (github.com/stripe/openapi tags, MIT). For each pair, the first N changed paths (sorted;
 *     a deterministic rule) are sliced from both versions, kept under the 1 MB request limit, and analysed.
 *  2. Curated cases (benchmark/curated/*.json): one scenario each, with the EXPECTED verdict or error.
 *
 *   bun run benchmark            # downloads sources into .bench/ (cached), writes benchmark/results.json + RESULTS.md
 *
 * Results are deterministic (no timings in the output). Real-world specs aren't committed (size); results.json
 * records the input hashes, so anyone can reproduce them from the same sources.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyze } from "../src/analyze";
import { BreakraError } from "../src/core/errors";
import { LIMITS } from "../src/core/limits";
import { validateSpec } from "../src/core/validate";
import { ENGINE_VERSION, RULE_SET_VERSION } from "../src/version";
import { loadGithubSpec, sliceKeys } from "./lib/github-slice";

const root = join(import.meta.dir, "..");
const bench = join(root, ".bench");
const out = join(root, "benchmark");

const GITHUB_PAIRS: Array<[string, string]> = [
  ["17.0.0", "18.0.0"],
  ["18.0.0", "19.0.0"],
  ["19.0.0", "20.0.0"],
  ["20.0.0", "21.0.0"],
  ["21.0.0", "22.0.0"],
  ["22.0.0", "23.0.0"],
  ["23.0.0", "24.0.0"],
];
const STRIPE_PAIRS: Array<[string, string]> = [
  ["v2400", "v2450"],
  ["v2450", "v2500"],
  ["v2500", "v2550"],
  ["v2550", "v2602"],
];
const MAX_PATHS = 25;

async function loadStripe(tag: string): Promise<Record<string, any>> {
  if (!/^v\d{1,5}$/.test(tag)) throw new Error("bad stripe tag");
  mkdirSync(bench, { recursive: true });
  const file = join(bench, `stripe-${tag}.json`);
  if (!existsSync(file)) {
    const res = await fetch(`https://raw.githubusercontent.com/stripe/openapi/${tag}/openapi/spec3.json`);
    if (!res.ok) throw new Error(`stripe ${tag}: HTTP ${res.status}`);
    writeFileSync(file, await res.text());
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

/**
 * Paths whose definition differs, *including the components they reference* (Stripe's paths are mostly $refs, so
 * comparing path objects alone misses most changes). Sorted, so the selection is deterministic.
 */
function changedPaths(a: Record<string, any>, b: Record<string, any>): string[] {
  const keys = [...new Set([...Object.keys(a.paths), ...Object.keys(b.paths)])].sort();
  return keys.filter((k) => JSON.stringify(sliceKeys(a, [k])) !== JSON.stringify(sliceKeys(b, [k])));
}

/** Within Breakra's limits? Uses the engine's own validation (size, depth, $ref expansion), never a guess. */
function fits(before: Record<string, any>, after: Record<string, any>): boolean {
  if (JSON.stringify({ before, after }).length > LIMITS.maxBodyBytes) return false;
  try {
    validateSpec(before as never, "before");
    validateSpec(after as never, "after");
    return true;
  } catch (e) {
    if (e instanceof BreakraError && e.code === "SPEC_TOO_COMPLEX") return false;
    throw e;
  }
}

type Row = Record<string, unknown>;

async function realCase(
  source: string,
  before: Record<string, any>,
  after: Record<string, any>,
  label: string,
) {
  const candidates = changedPaths(before, after);
  // Evenly spaced sample across all changed paths (deterministic), so no alphabetical slice dominates.
  const stride = Math.max(1, Math.floor(candidates.length / MAX_PATHS));
  const ordered = [
    ...candidates.filter((_, i) => i % stride === 0),
    ...candidates.filter((_, i) => i % stride !== 0),
  ];
  const selected: string[] = [];
  let skipped = 0;
  for (const k of ordered) {
    if (selected.length >= MAX_PATHS) break;
    const trial = [...selected, k];
    if (fits(sliceKeys(before, trial), sliceKeys(after, trial))) selected.push(k);
    else skipped++;
  }
  const input = { before: sliceKeys(before, selected), after: sliceKeys(after, selected) };
  const base = {
    id: `${source}-${label}`,
    source,
    versions: label,
    changed_paths_total: candidates.length,
    paths_compared: selected.length,
    paths_skipped_over_limits: skipped,
    request_bytes: JSON.stringify(input).length,
  };
  if (candidates.length > 0 && selected.length === 0) return { ...base, verdict: "not_assessed" } as Row;
  if (candidates.length === 0) return { ...base, verdict: "no_changes" } as Row;
  try {
    const r = await analyze(input);
    return {
      ...base,
      verdict: r.verdict,
      suggested_version_bump: r.suggested_version_bump,
      summary: r.summary,
      top_rules: topRules(r.changes),
      analysis_id: r.analysis_id,
      input_hashes: r.metadata.input_hashes,
    } as Row;
  } catch (e) {
    return { ...base, error: e instanceof BreakraError ? e.code : "CRASH" } as Row;
  }
}

function topRules(changes: Array<{ rule: string; compatibility: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of changes) {
    if (c.compatibility === "non_contract" || c.compatibility === "compatible") continue;
    counts[c.rule] = (counts[c.rule] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts)
      .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))
      .slice(0, 5),
  );
}

async function curatedCases(): Promise<Row[]> {
  const dir = join(out, "curated");
  const rows: Row[] = [];
  for (const f of readdirSync(dir)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const c = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const id = f.replace(/\.json$/, "");
    let got: Row;
    try {
      const r = await analyze({ before: c.before, after: c.after });
      got = {
        verdict: r.verdict,
        rules: [
          ...new Set(r.changes.filter((x) => x.compatibility !== "non_contract").map((x) => x.rule)),
        ].sort(),
        limitation: r.limitations.length > 0,
      };
    } catch (e) {
      got = { error: e instanceof BreakraError ? e.code : "CRASH" };
    }
    const exp = c.expect;
    const pass =
      (exp.error ? got.error === exp.error : got.verdict === exp.verdict) &&
      (exp.rules ?? []).every((rule: string) => (got.rules as string[] | undefined)?.includes(rule)) &&
      (exp.limitation === undefined || got.limitation === exp.limitation);
    rows.push({ id, description: c.description, why: c.why, expected: exp, got, pass });
  }
  return rows;
}

const real: Row[] = [];
for (const [a, b] of GITHUB_PAIRS) {
  console.error(`github ${a} -> ${b}`);
  real.push(await realCase("github", loadGithubSpec(a), loadGithubSpec(b), `${a}..${b}`));
}
for (const [a, b] of STRIPE_PAIRS) {
  console.error(`stripe ${a} -> ${b}`);
  real.push(await realCase("stripe", await loadStripe(a), await loadStripe(b), `${a}..${b}`));
}
const curated = await curatedCases();

const verdicts = { block: 0, review: 0, safe: 0, error: 0, not_assessed: 0, no_changes: 0 };
const totals = {
  total_changes: 0,
  breaking: 0,
  potentially_breaking: 0,
  unknown: 0,
  compatible: 0,
  non_contract: 0,
};
for (const r of real) {
  if (r.error) verdicts.error++;
  else verdicts[r.verdict as keyof typeof verdicts]++;
  for (const k of Object.keys(totals) as Array<keyof typeof totals>)
    totals[k] += (r.summary as any)?.[k] ?? 0;
}
const results = {
  engine_version: ENGINE_VERSION,
  rule_set_version: RULE_SET_VERSION,
  rule: `per version pair, an evenly spaced sample of up to ${MAX_PATHS} changed paths (sorted; a path counts as changed if it or any schema it references changed) that fit the request limits; paths over the limits are counted, not hidden`,
  real: { cases: real, verdicts, totals },
  curated: { cases: curated, passed: curated.filter((c) => c.pass).length, total: curated.length },
};
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
writeFileSync(join(out, "RESULTS.md"), renderMarkdown(results));
console.log(
  `benchmark: ${real.length} real pairs (block ${verdicts.block}, review ${verdicts.review}, safe ${verdicts.safe}, not assessed ${verdicts.not_assessed}, no changes ${verdicts.no_changes}, error ${verdicts.error}); curated ${results.curated.passed}/${results.curated.total} as expected`,
);

export function renderMarkdown(r: typeof results): string {
  const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "-");
  const t = r.real.totals;
  const lines = [
    "# Breakra benchmark",
    "",
    `Engine ${r.engine_version}, rule set ${r.rule_set_version}. Generated by \`bun run benchmark\` (deterministic; reproduce from the same public sources). Rule: ${r.rule}.`,
    "",
    "## Real API history",
    "",
    "| Source | Versions | Changed paths (compared / skipped) | Verdict | Breaking | Potentially breaking | Unknown | Compatible | Docs-only | Top rules (non-compatible) |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...r.real.cases.map((c: any) =>
      c.error
        ? `| ${c.source} | ${c.versions} | - | error: ${c.error} | | | | | | |`
        : !c.summary
          ? `| ${c.source} | ${c.versions} | ${c.changed_paths_total} (${c.paths_compared} / ${c.paths_skipped_over_limits}) | ${c.verdict === "not_assessed" ? "**not assessed** (every changed path exceeds the limits)" : "no changes"} | | | | | | |`
          : `| ${c.source} | ${c.versions} | ${c.changed_paths_total} (${c.paths_compared} / ${c.paths_skipped_over_limits}) | **${c.verdict}** | ${c.summary.breaking} | ${c.summary.potentially_breaking} | ${c.summary.unknown} | ${c.summary.compatible} | ${c.summary.non_contract} | ${Object.entries(
              c.top_rules,
            )
              .map(([k, v]) => `\`${k}\` ×${v}`)
              .join(", ")} |`,
    ),
    "",
    `**Verdicts across ${r.real.cases.length} real version pairs:** block ${r.real.verdicts.block}, review ${r.real.verdicts.review}, safe ${r.real.verdicts.safe}, not assessed ${r.real.verdicts.not_assessed}, no changes ${r.real.verdicts.no_changes}, error ${r.real.verdicts.error}.`,
    "",
    `**All ${t.total_changes} changes found:** breaking ${t.breaking} (${pct(t.breaking, t.total_changes)}), potentially breaking ${t.potentially_breaking} (${pct(t.potentially_breaking, t.total_changes)}), unknown ${t.unknown} (${pct(t.unknown, t.total_changes)}), compatible ${t.compatible} (${pct(t.compatible, t.total_changes)}), docs-only ${t.non_contract} (${pct(t.non_contract, t.total_changes)}).`,
    "",
    "## Curated scenarios (expected outcome vs Breakra)",
    "",
    "| Scenario | Expected | Got | Pass | Why it matters |",
    "|---|---|---|---|---|",
    ...r.curated.cases.map((c: any) => {
      const exp = c.expected.error ? `error ${c.expected.error}` : c.expected.verdict;
      const got = c.got.error ? `error ${c.got.error}` : c.got.verdict;
      return `| ${c.description} | ${exp} | ${got} | ${c.pass ? "✅" : "❌"} | ${c.why} |`;
    }),
    "",
    `**Curated: ${r.curated.passed}/${r.curated.total} as expected.**`,
    "",
  ];
  return lines.join("\n");
}

/**
 * Website v2 part 2 (D-037: an informational static site, no build step on Vercel). The homepage is the single
 * source of the shared header and footer: this script copies the blocks between <!-- header:start/end --> and
 * <!-- footer:start/end --> into every other page, and renders the /benchmark tables from benchmark/results.json
 * between <!-- bench:start/end -->. tests/site.test.ts checks every page is in sync.
 *
 *   bun scripts/site-pages.ts      # after changing the header, footer or benchmark results
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (p: string) => readFileSync(join(root, p), "utf8");

export const PAGES = [
  "integrations",
  "benchmark",
  "security",
  "compare",
  "pricing",
  "about",
  "contact",
  "brand",
  "blog",
  "orric",
  "status",
] as const;

/** The text between <!-- name:start --> and <!-- name:end --> (exclusive), or null when the markers are missing. */
export function block(html: string, name: string): string | null {
  const start = `<!-- ${name}:start -->`;
  const a = html.indexOf(start);
  const b = html.indexOf(`<!-- ${name}:end -->`);
  return a < 0 || b < a ? null : html.slice(a + start.length, b);
}

function replaceBlock(html: string, name: string, content: string): string {
  const start = `<!-- ${name}:start -->`;
  const a = html.indexOf(start);
  const b = html.indexOf(`<!-- ${name}:end -->`);
  if (a < 0 || b < a) throw new Error(`markers for ${name} not found`);
  return html.slice(0, a + start.length) + content + html.slice(b);
}

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const code = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

type Summary = Record<
  "breaking" | "potentially_breaking" | "unknown" | "compatible" | "non_contract",
  number
>;
type RealCase = {
  source: string;
  versions: string;
  changed_paths_total: number;
  paths_compared: number;
  paths_skipped_over_limits: number;
  verdict: string;
  summary?: Summary;
};
type Outcome = { verdict?: string; error?: string };
type CuratedCase = { description: string; why: string; expected: Outcome; got: Outcome; pass: boolean };

const outcome = (o: Outcome) => (o.error ? `error ${o.error}` : (o.verdict ?? ""));
const verdictCell = (v: string) =>
  v === "not_assessed"
    ? "not assessed"
    : v === "no_changes"
      ? "no changes"
      : `<span class="verdict verdict-${esc(v)}">${esc(v)}</span>`;

export function benchmarkHtml(): string {
  const r = JSON.parse(read("benchmark/results.json"));
  const real: RealCase[] = r.real.cases;
  const gh = real.filter((c) => c.source === "github");
  const count = (v: string) => gh.filter((c) => c.verdict === v).length;
  const t = r.real.totals;
  const pct = (n: number) => `${Math.round((n / t.total_changes) * 100)}%`;
  const rows = real
    .map((c) => {
      const s = c.summary;
      const nums = s
        ? [s.breaking, s.potentially_breaking, s.unknown, s.compatible, s.non_contract]
            .map((n) => `<td>${n}</td>`)
            .join("")
        : '<td colspan="5" class="muted">—</td>';
      return `<tr><td>${esc(c.source)}</td><td class="mono">${esc(c.versions)}</td><td>${c.changed_paths_total} (${c.paths_compared} / ${c.paths_skipped_over_limits})</td><td>${verdictCell(c.verdict)}</td>${nums}</tr>`;
    })
    .join("\n            ");
  const curated: CuratedCase[] = r.curated.cases;
  const crow = curated
    .map(
      (c) =>
        `<tr><td>${code(c.description)}</td><td class="mono">${esc(outcome(c.expected))}</td><td class="mono">${esc(outcome(c.got))}</td><td>${c.pass ? "✓" : "✗"}</td><td class="muted">${code(c.why)}</td></tr>`,
    )
    .join("\n            ");
  return `
      <div class="stats card">
        <div><p class="stat">${gh.length}</p><p class="muted">GitHub API version pairs</p></div>
        <div><p class="stat">${count("block")} · ${count("review")} · ${count("safe")}</p><p class="muted">block · review · safe</p></div>
        <div><p class="stat">${r.curated.passed}/${r.curated.total}</p><p class="muted">curated scenarios as expected</p></div>
      </div>

      <h2 class="label" id="real">Real API history</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Source</th><th>Versions</th><th>Changed paths (compared / skipped)</th><th>Verdict</th><th>Breaking</th><th>Potentially breaking</th><th>Unknown</th><th>Compatible</th><th>Docs-only</th></tr></thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <p class="muted small">All ${t.total_changes} changes found: breaking ${t.breaking} (${pct(t.breaking)}), potentially breaking ${t.potentially_breaking} (${pct(t.potentially_breaking)}), unknown ${t.unknown} (${pct(t.unknown)}), compatible ${t.compatible} (${pct(t.compatible)}), docs-only ${t.non_contract} (${pct(t.non_contract)}).</p>

      <h2 class="label" id="curated">Curated scenarios: expected vs Breakra</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Scenario</th><th>Expected</th><th>Got</th><th>Pass</th><th>Why it matters</th></tr></thead>
          <tbody>
            ${crow}
          </tbody>
        </table>
      </div>
      `;
}

/** A page with the homepage's header and footer copied in (and the benchmark tables for /benchmark). */
export function renderPage(name: (typeof PAGES)[number], page: string): string {
  const index = read("site/index.html");
  let out = page;
  for (const part of ["header", "footer"]) {
    const b = block(index, part);
    if (b === null) throw new Error(`site/index.html has no ${part} markers`);
    out = replaceBlock(out, part, b);
  }
  if (name === "benchmark") out = replaceBlock(out, "bench", benchmarkHtml());
  return out;
}

if (import.meta.main) {
  for (const name of PAGES) {
    const file = join(root, "site", `${name}.html`);
    writeFileSync(file, renderPage(name, readFileSync(file, "utf8")));
  }
  console.log(`site pages updated: ${PAGES.join(", ")}`);
}

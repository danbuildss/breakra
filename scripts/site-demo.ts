/**
 * "See it work" on breakra.dev (website v2): real engine output for six curated benchmark cases, rendered to static
 * HTML and injected into site/index.html between <!-- demo:start --> and <!-- demo:end -->. No network calls and no
 * inline script on the page; tests/site.test.ts checks the injected block equals this output.
 *
 *   bun scripts/site-demo.ts      # regenerate after an engine or case change
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../src/analyze";

const root = fileURLToPath(new URL("..", import.meta.url));
export const DEMO_CASES = [
  ["endpoint-removed", "Endpoint removed"],
  ["required-param-added", "Required param"],
  ["response-field-removed", "Field removed"],
  ["field-type-changed-same-name", "Type changed"],
  ["oas31-response-may-be-null", "3.1 null"],
  ["docs-only", "Docs only"],
] as const;

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export async function demoHtml(): Promise<string> {
  const tabs: string[] = [];
  const panes: string[] = [];
  for (const [i, [id, label]] of DEMO_CASES.entries()) {
    const c = JSON.parse(readFileSync(join(root, "benchmark/curated", `${id}.json`), "utf8"));
    const r = await analyze({ before: c.before, after: c.after });
    const shown = r.changes.filter(
      (x) => x.compatibility !== "compatible" && x.compatibility !== "non_contract",
    );
    const findings = shown.length
      ? shown
          .slice(0, 2)
          .map(
            (x) =>
              `<li><span class="sev sev-${x.compatibility}">${x.compatibility.replace("_", " ")}</span> ${esc(x.reason)}<br><span class="fix">→ ${esc(x.recommended_action)}</span></li>`,
          )
          .join("")
      : `<li><span class="sev sev-safe">safe</span> ${r.summary.total_changes} change(s), none that may break callers.</li>`;
    const sel = i === 0;
    tabs.push(
      `<button type="button" role="tab" id="demo-tab-${id}" aria-controls="demo-${id}" aria-selected="${sel}" tabindex="${sel ? 0 : -1}">${esc(label)}</button>`,
    );
    panes.push(
      `<div class="demo-pane" role="tabpanel" id="demo-${id}" aria-labelledby="demo-tab-${id}"${sel ? "" : " hidden"}>
          <div class="demo-change"><span class="demo-k">change</span>${esc(c.description)}</div>
          <div class="demo-out"><p class="demo-verdict">verdict: <span class="verdict verdict-${r.verdict}">${r.verdict}</span> <span class="muted">bump: ${r.suggested_version_bump}</span></p><ul>${findings}</ul><p class="demo-id muted">analysis_id: ${r.analysis_id.slice(0, 23)}…</p></div>
        </div>`,
    );
  }
  return `<div class="demo" data-tabs>
        <div class="demo-tabs" role="tablist" aria-label="Example changes">${tabs.join("")}</div>
        ${panes.join("\n        ")}
      </div>`;
}

export const START = "<!-- demo:start -->";
export const END = "<!-- demo:end -->";

if (import.meta.main) {
  const file = join(root, "site/index.html");
  const page = readFileSync(file, "utf8");
  const a = page.indexOf(START);
  const b = page.indexOf(END);
  if (a < 0 || b < a) throw new Error("demo markers not found in site/index.html");
  writeFileSync(
    file,
    `${page.slice(0, a + START.length)}\n      ${await demoHtml()}\n      ${page.slice(b)}`,
  );
  console.log("site demo updated");
}

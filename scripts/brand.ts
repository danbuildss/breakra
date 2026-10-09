/**
 * Generates docs/assets/demo-card.svg from the real demo output (demo/github-rest-api/response.json),
 * so the README graphic always matches the engine. tests/docs.test.ts fails if it is stale.
 *   bun run brand
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const INK = "#0D0C0A";
const PAPER = "#F4EFE1";
const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const SANS = "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface DemoResponse {
  analysis_id: string;
  summary: Record<string, number>;
  changes: Array<{ compatibility: string; operation: { method: string; path: string } | null }>;
}

export function demoCard(r: DemoResponse): string {
  const s = r.summary;
  const rows: Array<[string, number, string]> = [
    ["breaking", s.breaking ?? 0, "solid"],
    ["potentially breaking", s.potentially_breaking ?? 0, "outline"],
    ["compatible", s.compatible ?? 0, "dim"],
    ["docs only", s.non_contract ?? 0, "faint"],
  ];
  const max = Math.max(...rows.map((x) => x[1]), 1);
  const bars = rows
    .map(([label, n, style], i) => {
      const y = 150 + i * 40;
      const w = Math.max(4, Math.round((n / max) * 340));
      const bar =
        style === "solid"
          ? `<rect x="290" y="${y - 13}" width="${w}" height="16" rx="3" fill="${PAPER}"/>`
          : `<rect x="290.5" y="${y - 12.5}" width="${w - 1}" height="15" rx="3" fill="none" stroke="${PAPER}" stroke-opacity="${style === "outline" ? 1 : style === "dim" ? 0.45 : 0.22}"${style === "faint" ? ' stroke-dasharray="3 3"' : ""}/>`;
      const op = style === "solid" || style === "outline" ? 1 : style === "dim" ? 0.65 : 0.45;
      return `    <text x="60" y="${y}" font-size="15" fill="${PAPER}" fill-opacity="${op}">${label}</text>\n    ${bar}\n    <text x="${290 + w + 14}" y="${y}" font-size="15" font-weight="700" fill="${PAPER}" fill-opacity="${op}">${n}</text>`;
    })
    .join("\n");
  const removed = r.changes
    .filter((c) => c.compatibility === "breaking" && c.operation)
    .slice(0, 5)
    .map((c, i) => {
      const op = c.operation as { method: string; path: string };
      return `    <text x="700" y="${150 + i * 32}" font-size="14" fill="${PAPER}"><tspan font-weight="700">− ${esc(op.method)}</tspan> ${esc(op.path)}</text>`;
    })
    .join("\n");
  const id = r.analysis_id;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="400" viewBox="0 0 1280 400" role="img" aria-label="Breakra on GitHub's REST API description, Dec 2025 to Oct 2026: ${s.breaking} breaking, ${s.potentially_breaking} potentially breaking, ${s.compatible} compatible, ${s.non_contract} docs-only changes.">
  <rect width="1280" height="400" fill="${INK}"/>
  <rect x="20.5" y="20.5" width="1239" height="359" rx="16" fill="#14130F" stroke="${PAPER}" stroke-opacity="0.2"/>
  <text x="60" y="78" font-family="${SANS}" font-size="26" font-weight="700" fill="${PAPER}">GitHub REST API · Dec 2025 → Oct 2026</text>
  <text x="1220" y="78" font-family="${MONO}" font-size="14" fill="${PAPER}" fill-opacity="0.5" text-anchor="end">"compatibility": "breaking"</text>
  <line x1="60" y1="102" x2="1220" y2="102" stroke="${PAPER}" stroke-opacity="0.12"/>
  <g font-family="${MONO}">
${bars}
    <text x="700" y="124" font-size="12" fill="${PAPER}" fill-opacity="0.5" letter-spacing="1">REMOVED FROM THE CONTRACT</text>
${removed}
    <text x="60" y="345" font-size="12" fill="${PAPER}" fill-opacity="0.4">analysis_id ${esc(id.slice(0, 22))}…${esc(id.slice(-6))} · 6 paths · demo/github-rest-api</text>
  </g>
</svg>
`;
}

export function demoCardFromRepo(): string {
  return demoCard(JSON.parse(readFileSync(join(root, "demo/github-rest-api/response.json"), "utf8")));
}

if (import.meta.main) {
  const out = join(root, "docs/assets/demo-card.svg");
  writeFileSync(out, demoCardFromRepo());
  console.log(`wrote ${out}`);
}

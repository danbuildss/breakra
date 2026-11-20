/** Keeps breakra.dev (site/) truthful: every number and example on the page must match the code (D-037). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIMITS } from "../src/core/limits";
import { ENGINE_VERSION } from "../src/version";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const html = read("site/index.html");
// Visible text of the page, for content assertions only (never used as sanitised HTML).
const text = html
  .split(/<[^>]*>/)
  .join("")
  .replaceAll("&nbsp;", " ");
const response = JSON.parse(read("examples/response.json"));
const request = JSON.parse(read("examples/request.json"));
const LIVE_URL = "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze";

describe("site/index.html content", () => {
  it("shows the live endpoint, price and limits", () => {
    expect(text).toContain(LIVE_URL);
    expect(text).toContain("$0.02 USDC on Base, only on a 200");
    expect(LIMITS.maxBodyBytes).toBe(1024 * 1024);
    expect(text).toContain("≤ 1 MB");
    expect(text).toContain("OpenAPI 3.0.0–3.0.4 or 3.1.0–3.1.1");
    expect(text).toContain(`Engine ${ENGINE_VERSION}`);
    expect(text).toContain("npx -y breakra check"); // the free local path (npm) is on the page
  });

  it("the response excerpt quotes the real engine output", () => {
    const c = response.changes.find((x: { id: string }) => x.id === "change-002");
    for (const v of [
      c.reason,
      c.recommended_action,
      c.compatibility,
      c.location.name,
      response.compatibility,
      response.verdict,
      response.suggested_version_bump,
    ]) {
      expect(text).toContain(`"${v}"`);
    }
    for (const k of ["total_changes", "breaking", "potentially_breaking"] as const) {
      expect(text).toMatch(new RegExp(`"${k}": ${response.summary[k]}\\b`));
    }
  });

  it("the request excerpt matches examples/request.json", () => {
    const params = request.after.paths["/orders"].get.parameters;
    const added = params.find((p: { name: string }) => p.name === "customer_id");
    expect(added).toMatchObject({ in: "query", required: true });
    expect(request.before.paths["/orders"].get.parameters.map((p: { name: string }) => p.name)).toEqual([
      "limit",
    ]);
  });

  it("loads nothing from other origins and has no inline script or style (CSP-safe)", () => {
    for (const m of html.matchAll(
      /<(?:script|link(?![^>]*rel="canonical")|img)\b[^>]*(?:src|href)="([^"]+)"/g,
    )) {
      expect(m[1], m[1]).toMatch(/^\//);
    }
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
    expect(html).not.toMatch(/\sstyle="/);
    expect(html).not.toMatch(/<style\b/);
  });
});

describe("vercel.json", () => {
  it("sets a strict Content-Security-Policy and security headers", () => {
    const cfg = JSON.parse(read("vercel.json"));
    const headers = Object.fromEntries(
      cfg.headers[0].headers.map((h: { key: string; value: string }) => [h.key, h.value]),
    );
    expect(headers["Content-Security-Policy"]).toContain("default-src 'none'");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});

describe("vercel.json build settings", () => {
  it("serves site/ as-is: no install, no build of the API bundle", () => {
    const cfg = JSON.parse(read("vercel.json"));
    expect(cfg.outputDirectory).toBe("site");
    expect(cfg.framework).toBeNull();
    expect(cfg.buildCommand).not.toMatch(/bun|npm|build\.ts/);
    expect(cfg.installCommand).not.toMatch(/bun|npm|yarn|pnpm/);
  });
});

describe("agent files on breakra.dev", () => {
  it("vercel.json publishes SKILL.md and openapi.json from the repo root at deploy (single source)", () => {
    const cfg = JSON.parse(read("vercel.json"));
    expect(cfg.buildCommand).toBe("cp SKILL.md site/skill.md && cp openapi.json site/openapi.json");
    expect(cfg.redirects).toContainEqual({ source: "/SKILL.md", destination: "/skill.md", permanent: true });
    expect(html).toContain('href="/skill.md"');
    // D-019 amendment: owner-approved credit at the bottom of the page.
    expect(html).toContain('Built by <a href="https://somehowinternet.app" rel="noopener">SOMEHOW</a>');
    expect(html).not.toMatch(/CORTX/i);
    expect(html).toContain('href="/openapi.json"');
  });
});

describe("breakra.dev/api/analyze (D-038)", () => {
  it("forwards to the live Bankr endpoint and is listed for x402 discovery", () => {
    const cfg = JSON.parse(read("vercel.json"));
    expect(cfg.rewrites).toEqual([{ source: "/api/analyze", destination: LIVE_URL }]);
    const wellKnown = JSON.parse(read("site/.well-known/x402"));
    expect(wellKnown).toEqual({ version: 1, resources: ["https://breakra.dev/api/analyze"] });
  });
});

describe("website v2 homepage", () => {
  it('"See it work" is exactly the engine output for the curated cases (scripts/site-demo.ts)', async () => {
    const { demoHtml, START, END } = await import("../scripts/site-demo");
    const block = html.slice(html.indexOf(START) + START.length, html.indexOf(END)).trim();
    expect(block).toBe((await demoHtml()).trim());
  });

  it("the benchmark numbers match benchmark/results.json", () => {
    const bench = JSON.parse(read("benchmark/results.json"));
    const gh = bench.real.cases.filter((c: { source: string }) => c.source === "github");
    const n = (v: string) => gh.filter((c: { verdict: string }) => c.verdict === v).length;
    expect(text).toContain(`${gh.length}GitHub API version pairs compared`);
    expect(text).toContain(`${n("block")} · ${n("review")} · ${n("safe")}block · review · safe`);
    expect(text).toContain(`${bench.curated.passed}/${bench.curated.total}curated scenarios as expected`);
  });

  it("publishes /llms.txt and links it", () => {
    const llms = read("site/llms.txt");
    expect(llms).toMatch(/^# Breakra\n/);
    expect(llms).toContain("https://breakra.dev/skill.md");
    expect(html).toContain('href="/llms.txt"');
  });

  it("labels unbuilt products as roadmap or research, never as shipped", () => {
    expect(html).toMatch(/GitHub Action <span class="tag">roadmap<\/span>/);
    expect(html).toMatch(/Impact <span class="tag">research<\/span>/);
  });
});

describe("website v2 inner pages", async () => {
  const { PAGES, block, renderPage, benchmarkHtml } = await import("../scripts/site-pages");
  const pages = Object.fromEntries(PAGES.map((p) => [p, read(`site/${p}.html`)])) as Record<
    (typeof PAGES)[number],
    string
  >;

  it("every page is exactly what scripts/site-pages.ts renders (shared header and footer, benchmark tables)", () => {
    for (const p of PAGES) expect(pages[p], p).toBe(renderPage(p, pages[p]));
    for (const p of PAGES) {
      expect(block(pages[p], "header")).toBe(block(html, "header"));
      expect(block(pages[p], "footer")).toBe(block(html, "footer"));
    }
    expect(block(pages.benchmark, "bench")).toBe(benchmarkHtml());
  });

  it("each page is CSP-safe, has its own canonical URL and is in the sitemap", () => {
    const sitemap = read("site/sitemap.xml");
    for (const p of PAGES) {
      const page = pages[p];
      for (const m of page.matchAll(
        /<(?:script|link(?![^>]*rel="canonical")|img)\b[^>]*(?:src|href)="([^"]+)"/g,
      ))
        expect(m[1], `${p}: ${m[1]}`).toMatch(/^\//);
      expect(page).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
      expect(page).not.toMatch(/\sstyle="/);
      expect(page).not.toMatch(/<style\b/);
      expect(page).not.toMatch(/CORTX/i);
      expect(page).toContain(`<link rel="canonical" href="https://breakra.dev/${p}">`);
      expect(sitemap).toContain(`<loc>https://breakra.dev/${p}</loc>`);
    }
  });

  it("every internal link on every page resolves to a file in site/ (or a file copied in at deploy)", () => {
    const atDeploy = new Set(["/skill.md", "/openapi.json", "/api/analyze"]);
    const all: Array<[string, string]> = [["index", html], ...Object.entries(pages)];
    for (const [name, page] of all) {
      for (const m of page.matchAll(/href="(\/[^"#?]*)/g)) {
        const path = m[1] ?? "";
        if (path === "/" || atDeploy.has(path)) continue;
        const file = /\.[a-z0-9]+$/.test(path) ? path : `${path}.html`; // cleanUrls
        expect(() => read(`site${file}`), `${name}: ${path}`).not.toThrow();
      }
    }
  });

  it("the compare page states the documented oasdiff differences", () => {
    const diffs = JSON.parse(read("tests/oracle-differences.json"));
    expect(diffs.length).toBe(3); // 2 behaviours (authentication added, optional response field removed)
    expect(pages.compare).toContain("Authentication added");
    expect(pages.compare).toContain("Optional response field removed");
  });

  it("the security page states the real limits", () => {
    const t = pages.security.split(/<[^>]*>/).join(""); // visible text, for assertions only
    expect(t).toContain("≤ 1 MB");
    expect(t).toContain(`nesting depth ${LIMITS.maxDepth}`);
    expect(t).toContain(`${LIMITS.maxNodes.toLocaleString("en-US")} nodes`);
    expect(t).toContain(`${LIMITS.maxOperations.toLocaleString("en-US")} operations`);
    expect(t).toContain(`${LIMITS.maxExpandedNodes.toLocaleString("en-US")} nodes after expanding`);
  });
});

describe("logo (brand kit)", () => {
  const pathOf = (svg: string) => svg.match(/ d="([^"]+)"/)?.[1];
  it("the header and footer logo is the published logo, and the favicon is the published mark", () => {
    const logo = pathOf(read("site/logo/breakra-logo-black.svg"));
    const mark = pathOf(read("site/logo/breakra-mark-black.svg"));
    expect(logo).toBeTruthy();
    expect(pathOf(read("site/logo/breakra-logo-offwhite.svg"))).toBe(logo);
    expect(pathOf(read("site/logo/breakra-mark-offwhite.svg"))).toBe(mark);
    const inline = [...html.matchAll(/<svg class="logo"[^>]*><path[^>]* d="([^"]+)"/g)].map((m) => m[1]);
    expect(inline).toEqual([logo, logo]); // header + footer
    expect(pathOf(read("site/favicon.svg"))).toBe(mark);
  });
});

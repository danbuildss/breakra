/** Keeps breakra.dev (site/) truthful: every number and example on the page must match the code (D-037). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIMITS } from "../src/core/limits";

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
    expect(text).toContain("OpenAPI 3.0.0–3.0.4");
  });

  it("the response excerpt quotes the real engine output", () => {
    const c = response.changes.find((x: { id: string }) => x.id === "change-002");
    for (const v of [
      c.reason,
      c.recommended_action,
      c.compatibility,
      c.location.name,
      response.compatibility,
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

describe("site/vercel.json", () => {
  it("sets a strict Content-Security-Policy and security headers", () => {
    const cfg = JSON.parse(read("site/vercel.json"));
    const headers = Object.fromEntries(
      cfg.headers[0].headers.map((h: { key: string; value: string }) => [h.key, h.value]),
    );
    expect(headers["Content-Security-Policy"]).toContain("default-src 'none'");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});

/**
 * Keeps the agent-facing docs (openapi.json, SKILL.md, examples/) in sync with the code (D-032).
 * If one of these fails after a code change, update the doc, or run `bun run examples`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { demoCardFromRepo } from "../scripts/brand";
import { demoResponse } from "../scripts/demo";
import { exampleResponse } from "../scripts/examples";
import { BreakraError, type ErrorCode } from "../src/core/errors";
import { SEVERITY } from "../src/core/format";
import { LIMITS } from "../src/core/limits";
import { validateSpec } from "../src/core/validate";
import { ENGINE_VERSION, RULE_SET_VERSION } from "../src/version";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const openapi = JSON.parse(read("openapi.json"));
const schemas = openapi.components.schemas;
const op = (Object.values(openapi.paths)[0] as { post: Record<string, any> }).post;
const response = JSON.parse(read("examples/response.json"));
const skill = read("SKILL.md");
const LIVE_URL = "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze";

describe("examples/response.json", () => {
  it("is exactly what the engine returns for examples/request.json", async () => {
    expect(await exampleResponse()).toEqual(response);
  });

  it("shows every class except unknown", () => {
    expect(response.summary.breaking).toBeGreaterThan(0);
    expect(response.summary.potentially_breaking).toBeGreaterThan(0);
    expect(response.summary.compatible).toBeGreaterThan(0);
    expect(response.summary.non_contract).toBeGreaterThan(0);
  });
});

describe("openapi.json", () => {
  it("is a valid OpenAPI 3.1 document by Breakra's own validator (Circle's agent-readiness check wants 3.1)", () => {
    expect(openapi.openapi).toBe("3.1.0");
    expect(JSON.stringify(openapi)).not.toMatch(/"nullable"|"example":/); // 3.0-only keywords
    expect(() => validateSpec(openapi, "after")).not.toThrow();
  });

  it("matches the engine version and live URL", () => {
    expect(openapi.info.version).toBe(ENGINE_VERSION);
    const [path] = Object.keys(openapi.paths);
    // D-038: discovery origin is breakra.dev (Vercel forwards /api/analyze to the Bankr endpoint).
    expect(`${openapi.servers[0].url}${path}`).toBe("https://breakra.dev/api/analyze");
    expect(openapi.info.description).toContain(LIVE_URL);
  });

  it("lists exactly the fields the engine returns", () => {
    expect([...schemas.AnalysisResult.required].sort()).toEqual(Object.keys(response).sort());
    // `impact` is the one optional field: present only when the request has `uses` (tested below).
    expect(
      Object.keys(schemas.AnalysisResult.properties)
        .filter((k) => k !== "impact")
        .sort(),
    ).toEqual(Object.keys(response).sort());
    expect(Object.keys(schemas.AnalysisResult.properties.summary.properties).sort()).toEqual(
      Object.keys(response.summary).sort(),
    );
    expect(Object.keys(schemas.AnalysisResult.properties.metadata.properties).sort()).toEqual(
      Object.keys(response.metadata).sort(),
    );
    for (const change of response.changes) {
      expect([...schemas.Change.required].sort()).toEqual(Object.keys(change).sort());
      for (const key of Object.keys(change.location)) {
        expect(schemas.Change.properties.location.properties).toHaveProperty(key);
      }
      expect(schemas.Change.properties.direction.enum).toContain(change.direction);
    }
  });

  it("documents the impact section exactly as the engine returns it for `uses`", async () => {
    const req = JSON.parse(read("examples/request.json"));
    const { analyze } = await import("../src/analyze");
    const r = await analyze({ ...req, uses: [{ method: "GET", path: "/orders" }] });
    expect(Object.keys(schemas.Impact.properties).sort()).toEqual(Object.keys(r.impact ?? {}).sort());
    expect(schemas.Verdict.enum).toContain(r.verdict);
    expect(schemas.AnalysisResult.properties.suggested_version_bump.enum).toContain(r.suggested_version_bump);
  });

  it("lists exactly the engine's compatibility classes", () => {
    expect([...schemas.Compatibility.enum].sort()).toEqual(Object.keys(SEVERITY).sort());
  });

  it("documents every error code with its real HTTP status", () => {
    const codes: ErrorCode[] = schemas.Error.properties.error.properties.code.enum;
    expect(codes).toHaveLength(7);
    for (const code of codes) {
      const err = new BreakraError(code, "x");
      expect(op.responses).toHaveProperty(String(err.status));
      expect(skill).toContain(`| ${err.status} | \`${code}\``);
    }
  });

  it("states the real limits", () => {
    expect(schemas.AnalysisResult.properties.changes.maxItems).toBe(LIMITS.maxChanges);
    expect(LIMITS.maxBodyBytes).toBe(1024 * 1024);
    expect(op.description).toContain("1 MB");
  });
});

describe("SKILL.md", () => {
  it("states the live URL, price and limits", () => {
    expect(skill).toContain(LIVE_URL);
    expect(skill).toContain("$0.02 USDC on Base");
    expect(skill).toContain("amount `20000`");
    expect(skill).toContain(`1 MB body (${LIMITS.maxBodyBytes.toLocaleString("en-US")} bytes`);
    // Payment terms verified live in Phase 3 (V0): Bankr's fee router, 60 s signature validity.
    expect(skill).toContain("`0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0`");
    expect(skill).toContain("| `maxTimeoutSeconds` | `60`");
    expect(skill).toContain(`nesting ${LIMITS.maxDepth}`);
    expect(skill).toContain(`${LIMITS.maxOperations.toLocaleString("en-US")} operations`);
    expect(skill).toContain(`${LIMITS.maxExpandedNodes.toLocaleString("en-US")} nodes`);
    expect(skill).toContain(`capped at ${LIMITS.maxChanges}`);
  });

  it("quotes a finding that the engine really produces", () => {
    const quoted = response.changes.find((c: { id: string }) => c.id === "change-002");
    expect(skill).toContain(quoted.reason);
    expect(skill).toContain(quoted.recommended_action);
    for (const [key, value] of Object.entries(response.summary))
      expect(skill).toContain(`"${key}": ${value}`);
  });
});

describe("demo/github-rest-api", () => {
  const demo = (name: string) => JSON.parse(read(`demo/github-rest-api/${name}`));
  it("response.json is exactly what the engine returns for the committed before/after", async () => {
    expect(await demoResponse(demo("before.json"), demo("after.json"))).toEqual(demo("response.json"));
  });
  it("the write-up quotes the real summary", () => {
    const { summary, analysis_id } = demo("response.json");
    const readme = read("demo/github-rest-api/README.md");
    expect(readme).toContain(analysis_id);
    for (const k of ["breaking", "potentially_breaking", "compatible", "non_contract"] as const) {
      expect(readme).toContain(`| \`${k}\` | ${summary[k]} |`);
    }
  });
});

describe("SKILL.md front matter", () => {
  it("has the name and description that skill directories require", () => {
    const fm = skill.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
    expect(fm?.[1]).toBe("breakra");
    expect((fm?.[2] ?? "").length).toBeGreaterThan(50);
  });
});

describe("docs/project/launch/bankr-skills (catalog submission)", () => {
  it("keeps no second SKILL.md in the repo (one canonical skill; the fork gets a copy at submission)", () => {
    expect(existsSync(join(root, "docs/project/launch/bankr-skills/breakra/SKILL.md"))).toBe(false);
  });
  it("catalog.json follows the catalog format", () => {
    const c = JSON.parse(read("docs/project/launch/bankr-skills/breakra/catalog.json"));
    expect(c).toMatchObject({
      schemaVersion: 1,
      slug: "breakra",
      install: { type: "bankr", repoPath: "breakra" },
    });
    expect(c.install.command).toBe(
      "install the breakra skill from https://github.com/BankrBot/skills/tree/main/breakra",
    );
    expect(JSON.stringify(c)).toContain("20000");
  });
});

describe("README and brand assets", () => {
  const readme = read("README.md");
  it("engine badge matches ENGINE_VERSION", () => {
    expect(readme).toContain(`badge/engine-${ENGINE_VERSION}-`);
  });
  it("demo card is generated from the current demo output (bun run brand)", () => {
    expect(read("docs/assets/demo-card.svg")).toBe(demoCardFromRepo());
  });
  it("every relative link and image in the README exists", () => {
    const targets = [...readme.matchAll(/(?:src|href)="([^"#]+)"|\]\(([^)#]+)\)/g)]
      .map((m) => (m[1] ?? m[2]) as string)
      .filter((t) => !/^(https?:|mailto:)/.test(t));
    expect(targets.length).toBeGreaterThan(15);
    for (const t of targets) expect(existsSync(join(root, t)), t).toBe(true);
  });
});

describe("openapi.json discovery metadata (x402scan / @agentcash/discovery)", () => {
  it("declares x402 pricing, a 402 response, a JSON request body and a contact", () => {
    expect(op["x-payment-info"]).toEqual({
      price: { mode: "fixed", currency: "USD", amount: "0.02" },
      protocols: [{ x402: {} }],
    });
    expect(op.responses).toHaveProperty("402");
    expect(op.requestBody.content["application/json"].schema).toBeDefined();
    expect(openapi.info.contact.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
    expect(openapi.info.contact.url).toBeTruthy();
    expect(openapi.info["x-guidance"]).toContain("https://breakra.dev/skill.md");
  });
});

describe("payment wording and agent safety (PR A, 2026-11-20)", () => {
  // Blanket "free" claims are wrong for gateway failures after settlement; agents could pay twice.
  const PUBLIC = [
    "README.md",
    "SKILL.md",
    "SECURITY.md",
    "CHANGELOG.md",
    "docs/API.md",
    "openapi.json",
    "site/index.html",
    "scripts/build.ts",
    "docs/assets/hero.svg",
    "docs/assets/how-it-works.svg",
    "docs/assets/payment-flow.svg",
    "docs/project/launch/bankr-skills/README.md",
    "docs/project/launch/bankr-skills/breakra/catalog.json",
  ];
  const BANNED = [
    /every error \(4xx\/5xx\) is free/i,
    /every 4xx\/5xx is free/i,
    /4xx\/5xx are free/i,
    /(?<!own )errors are free/i,
    /(?<!Breakra's )(?<!own )errors are never charged/i,
    /every error is free/i,
    /any error is never charged/i,
  ];
  it("no public file claims that every error is free", () => {
    for (const f of PUBLIC) {
      const text = read(f);
      for (const b of BANNED) expect(text, `${f} matches ${b}`).not.toMatch(b);
    }
  });

  it("SKILL.md starts with the agent safety rules and the unknown-outcome rule", () => {
    const rules = skill.indexOf("## Safety rules for agents");
    expect(rules).toBeGreaterThan(0);
    expect(rules).toBeLessThan(skill.indexOf("## When to use it"));
    for (const phrase of [
      "Prefer the free local mode",
      "authorization",
      "Never ask for, read, print or store a private key",
      "untrusted data",
      "never proof of safety",
      "Anything else is an unknown outcome",
    ])
      expect(skill).toContain(phrase);
  });

  it("version strings match src/version.ts", () => {
    expect(read("docs/API.md").split("\n")[0]).toContain(
      `engine ${ENGINE_VERSION}, rule set ${RULE_SET_VERSION}`,
    );
    expect(read("README.md")).toContain(`(rule set ${RULE_SET_VERSION})`);
    expect(schemas.Compatibility.description).toContain(`rule set ${RULE_SET_VERSION}`);
    expect(read("RULES.md").split("\n")[0]).toContain(`Rule Set ${RULE_SET_VERSION}`);
  });
});

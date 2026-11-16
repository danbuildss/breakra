/** Engine 0.2.0 / rule set 0.2.0 (D-039): verdict, semver advice, `uses` impact, YAML input, OpenAPI 3.1. */
import { describe, expect, it } from "vitest";
import { analyze } from "../src/analyze";
import type { BreakraError } from "../src/core/errors";
import { parseRequestBody } from "../src/core/validate";
import { operationKey, parseUses, verdictFor, versionBumpFor } from "../src/core/verdict";

const counts = (c: Partial<Record<string, number>>) => ({
  breaking: 0,
  potentially_breaking: 0,
  unknown: 0,
  compatible: 0,
  non_contract: 0,
  ...c,
});

const spec = (version = "3.0.3", extra: Record<string, unknown> = {}) => ({
  openapi: version,
  info: { title: "Orders", version: "1" },
  paths: {
    "/orders": {
      get: { responses: { "200": { description: "ok" } } },
      post: { responses: { "201": { description: "created" } } },
    },
    "/orders/{id}": { get: { responses: { "200": { description: "ok" } } } },
  },
  ...extra,
});
const enc = (body: unknown) => new TextEncoder().encode(JSON.stringify(body));
const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as BreakraError).code;
  }
  return "no error";
};

describe("verdict and semver advice", () => {
  it.each([
    [{ breaking: 1, compatible: 3 }, "block", "major"],
    [{ potentially_breaking: 1 }, "review", "major"],
    [{ unknown: 1 }, "review", "major"],
    [{ compatible: 2, non_contract: 1 }, "safe", "minor"],
    [{ non_contract: 1 }, "safe", "patch"],
    [{}, "safe", "none"],
  ])("%j → %s, %s", (c, verdict, bump) => {
    expect(verdictFor(counts(c))).toBe(verdict);
    expect(versionBumpFor(counts(c))).toBe(bump);
  });
});

describe("`uses`: does this change break me?", () => {
  it("matches path templates regardless of parameter names and method case", () => {
    expect(operationKey("get", "/orders/{orderId}")).toBe(operationKey("GET", "/orders/{id}"));
  });

  it("reports only the findings on the operations you use", async () => {
    const after = spec();
    delete (after.paths["/orders"] as Record<string, unknown>).post; // breaking: POST /orders removed
    const mine = await analyze({
      before: spec(),
      after,
      uses: [{ method: "GET", path: "/orders/{orderId}" }],
    });
    expect(mine.verdict).toBe("block"); // the API as a whole
    expect(mine.impact?.verdict).toBe("safe"); // but not for a caller of GET /orders/{id}
    expect(mine.impact?.change_ids).toEqual([]);

    const theirs = await analyze({ before: spec(), after, uses: [{ method: "POST", path: "/orders" }] });
    expect(theirs.impact?.verdict).toBe("block");
    expect(theirs.impact?.affecting.breaking).toBe(1);
    expect(theirs.impact?.change_ids).toEqual(["change-001"]);
  });

  it("flags operations that the before document doesn't define", async () => {
    const r = await analyze({ before: spec(), after: spec(), uses: [{ method: "GET", path: "/ordrs" }] });
    expect(r.impact?.not_in_before).toEqual([{ method: "GET", path: "/ordrs" }]);
  });

  it("gives a different analysis_id with uses, and the same id for the same uses in any order", async () => {
    const a = await analyze({ before: spec(), after: spec() });
    const b = await analyze({
      before: spec(),
      after: spec(),
      uses: [
        { method: "GET", path: "/orders" },
        { method: "POST", path: "/orders" },
      ],
    });
    const c = await analyze({
      before: spec(),
      after: spec(),
      uses: [
        { method: "POST", path: "/orders" },
        { method: "get", path: "/orders" },
      ],
    });
    expect(b.analysis_id).not.toBe(a.analysis_id);
    expect(c.analysis_id).toBe(b.analysis_id);
  });

  it.each([
    [[]],
    ["GET /orders"],
    [[{ method: "FETCH", path: "/x" }]],
    [[{ method: "GET", path: "orders" }]],
    [Array.from({ length: 1001 }, () => ({ method: "GET", path: "/x" }))],
  ])("rejects malformed uses %#", (uses) => {
    expect(codeOf(() => parseUses(uses))).toBe("INVALID_REQUEST");
  });
});

describe("YAML and JSON text input", () => {
  const yamlSpec = `openapi: 3.0.3
info: { title: Orders, version: "1" }
paths:
  /orders:
    get:
      responses:
        "200": { description: ok }
`;

  it("accepts documents sent as YAML or JSON text, alongside objects", async () => {
    const input = parseRequestBody(enc({ before: yamlSpec, after: JSON.stringify(spec()) }));
    const r = await analyze(input);
    expect(r.status).toBe("success");
    expect(r.summary.compatible).toBeGreaterThan(0); // POST /orders and /orders/{id} added
  });

  it("gives YAML and the equivalent JSON object the same analysis_id", async () => {
    const asObject = {
      openapi: "3.0.3",
      info: { title: "Orders", version: "1" },
      paths: { "/orders": { get: { responses: { "200": { description: "ok" } } } } },
    };
    const fromYaml = await analyze(parseRequestBody(enc({ before: yamlSpec, after: yamlSpec })));
    const fromJson = await analyze({ before: asObject, after: asObject });
    expect(fromYaml.analysis_id).toBe(fromJson.analysis_id);
  });

  it("rejects text that isn't an object, without echoing it", () => {
    for (const bad of ["just a string", "- a\n- list", "{not json", ": : :"]) {
      try {
        parseRequestBody(enc({ before: bad, after: yamlSpec }));
        expect.unreachable();
      } catch (e) {
        expect((e as BreakraError).code).toBe("INVALID_REQUEST");
        expect((e as BreakraError).message).not.toContain(bad);
      }
    }
  });

  const bombOf = (depth: number) => {
    const levels = ["a: &a [x, x, x, x, x, x, x, x, x, x]"];
    for (let i = 1; i < depth; i++) {
      const prev = String.fromCharCode(96 + i);
      const cur = String.fromCharCode(97 + i);
      levels.push(
        `${cur}: &${cur} [*${prev}, *${prev}, *${prev}, *${prev}, *${prev}, *${prev}, *${prev}, *${prev}, *${prev}, *${prev}]`,
      );
    }
    return `openapi: 3.0.3\ninfo: {title: t, version: "1"}\npaths: {}\nx-bomb:\n  ${levels.join("\n  ")}\n`;
  };

  it("refuses a deep alias bomb in the parser (billion laughs), as a free 400", () => {
    expect(codeOf(() => parseRequestBody(enc({ before: bombOf(9), after: yamlSpec })))).toBe(
      "INVALID_REQUEST",
    );
  });

  it("bounds smaller alias expansions with the node limit", async () => {
    // 10^6 nodes once expanded: accepted by the parser, rejected by validation before the diff runs.
    let code = "no error";
    try {
      await analyze(parseRequestBody(enc({ before: bombOf(6), after: yamlSpec })));
    } catch (e) {
      code = (e as BreakraError).code;
    }
    expect(["INVALID_REQUEST", "SPEC_TOO_COMPLEX"]).toContain(code);
  });

  it("explains when no YAML parser is available (non-Bun runtimes)", () => {
    expect(codeOf(() => parseRequestBody(enc({ before: yamlSpec, after: yamlSpec }), null))).toBe(
      "INVALID_REQUEST",
    );
  });

  it("still rejects unknown top-level fields and URLs-as-fields", () => {
    expect(codeOf(() => parseRequestBody(enc({ before: spec(), after: spec(), url: "https://x" })))).toBe(
      "INVALID_REQUEST",
    );
    expect(codeOf(() => parseRequestBody(enc({ before: 1, after: spec() })))).toBe("INVALID_REQUEST");
  });
});

describe("OpenAPI 3.1 (rule set 0.2.0)", () => {
  const body = (schema: unknown) => ({
    openapi: "3.1.0",
    info: { title: "t", version: "1" },
    paths: {
      "/o": {
        post: {
          requestBody: { required: true, content: { "application/json": { schema } } },
          responses: { "200": { description: "ok", content: { "application/json": { schema } } } },
        },
      },
    },
  });
  const run = async (before: unknown, after: unknown) =>
    (await analyze({ before: body(before) as never, after: body(after) as never })).changes.map(
      (c) => `${c.direction}:${c.compatibility}`,
    );

  it("a type list that gains null widens: compatible for requests, potentially breaking for responses", async () => {
    const r = await run(
      { type: "object", properties: { a: { type: "string" } } },
      { type: "object", properties: { a: { type: ["string", "null"] } } },
    );
    expect(r.sort()).toEqual(["request:compatible", "response:potentially_breaking"]);
  });

  it("a type list that loses null narrows", async () => {
    const r = await run(
      { type: "object", properties: { a: { type: ["string", "null"] } } },
      { type: "object", properties: { a: { type: "string" } } },
    );
    expect(r.sort()).toEqual(["request:potentially_breaking", "response:compatible"]);
  });

  it("a numeric exclusiveMinimum is a bound, never documentation", async () => {
    const r = await run({ type: "integer" }, { type: "integer", exclusiveMinimum: 5 });
    expect(r.sort()).toEqual(["request:potentially_breaking", "response:compatible"]);
  });

  it("`examples` lists are documentation", async () => {
    const r = await run({ type: "string", examples: ["a"] }, { type: "string", examples: ["b"] });
    expect(r).toEqual(["request:non_contract", "response:non_contract"]);
  });

  it("accepts a 3.1 document without paths (webhooks or components only)", async () => {
    const doc = { openapi: "3.1.0", info: { title: "t", version: "1" }, webhooks: {} };
    const r = await analyze({ before: doc, after: doc });
    expect(r.verdict).toBe("safe");
  });
});

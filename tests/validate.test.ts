import { describe, expect, it } from "vitest";
import { LIMITS } from "../src/core/limits";
import { baseSpec, clone, post } from "./helpers";

const code = (r: { json: Record<string, any> }) => r.json.error?.code;

describe("request parsing", () => {
  it("rejects invalid JSON with 400", async () => {
    const r = await post("{not json");
    expect(r.status).toBe(400);
    expect(code(r)).toBe("INVALID_REQUEST");
  });
  it("rejects an empty body", async () => {
    expect((await post("")).status).toBe(400);
  });
  it("rejects a non-object body", async () => {
    expect((await post([1, 2])).status).toBe(400);
  });
  it("rejects missing fields", async () => {
    const r = await post({ before: baseSpec() });
    expect(r.status).toBe(400);
  });
  it("rejects extra fields, including URL mode", async () => {
    const r = await post({ before: baseSpec(), after: baseSpec(), before_url: "https://x" });
    expect(r.status).toBe(400);
    expect(r.json.error.message).toMatch(/URL inputs are not supported/);
  });
  it("rejects non-object specs", async () => {
    expect((await post({ before: "x", after: baseSpec() })).status).toBe(400);
  });
  it("rejects bodies over 2 MB with 413", async () => {
    const big = clone(baseSpec());
    big.info.description = "x".repeat(LIMITS.maxBodyBytes);
    const r = await post({ before: baseSpec(), after: big });
    expect(r.status).toBe(413);
    expect(code(r)).toBe("PAYLOAD_TOO_LARGE");
  });
  it("rejects non-POST methods with 405", async () => {
    const r = await post("", { method: "GET", body: undefined });
    expect(r.status).toBe(405);
  });
  it("never returns stack traces or echoes input in errors", async () => {
    const r = await post({ before: { swagger: "2.0", secret: "TOPSECRET" }, after: baseSpec() });
    expect(JSON.stringify(r.json)).not.toMatch(/TOPSECRET|at .*\.ts/);
  });
});

describe("OpenAPI validation", () => {
  it("accepts 3.0.0 through 3.0.4", async () => {
    for (const v of ["3.0.0", "3.0.1", "3.0.2", "3.0.3", "3.0.4"]) {
      const s = clone(baseSpec());
      s.openapi = v;
      expect((await post({ before: s, after: s })).status).toBe(200);
    }
  });
  it("rejects Swagger 2.0 and OpenAPI 3.1 as unsupported (422)", async () => {
    const swagger = { swagger: "2.0", info: { title: "t", version: "1" }, paths: {} };
    const v31 = { ...baseSpec(), openapi: "3.1.0" };
    for (const bad of [swagger, v31]) {
      const r = await post({ before: baseSpec(), after: bad });
      expect(r.status).toBe(422);
      expect(code(r)).toBe("UNSUPPORTED_OPENAPI_VERSION");
    }
  });
  it("rejects structurally invalid documents (422)", async () => {
    const cases: Array<(s: Record<string, any>) => void> = [
      (s) => delete s.openapi,
      (s) => delete s.info,
      (s) => (s.info.title = 3),
      (s) => (s.paths = []),
      (s) => (s.paths = { users: {} }),
      (s) => (s.paths["/users"].get.parameters = {}),
      (s) => (s.paths["/users"].get = "nope"),
    ];
    for (const mutate of cases) {
      const s = clone(baseSpec());
      mutate(s);
      const r = await post({ before: baseSpec(), after: s });
      expect(r.status).toBe(422);
      expect(code(r)).toBe("INVALID_SPECIFICATION");
    }
  });
  it("rejects a dangling local $ref", async () => {
    const s = clone(baseSpec());
    s.paths["/users"].get.responses["200"].content["application/json"].schema = {
      $ref: "#/components/schemas/Missing",
    };
    const r = await post({ before: baseSpec(), after: s });
    expect(r.status).toBe(422);
    expect(code(r)).toBe("INVALID_SPECIFICATION");
  });
  it("treats a schema property literally named $ref as a key, not a reference", async () => {
    const s = clone(baseSpec());
    s.paths["/users"].get.responses["200"].content["application/json"].schema.properties.$ref = {
      type: "string",
    };
    expect((await post({ before: baseSpec(), after: s })).status).toBe(200);
  });
});

describe("complexity limits (bounded before diffing)", () => {
  it("rejects excessive nesting", async () => {
    const s = clone(baseSpec());
    let node: Record<string, any> = {};
    s["x-deep"] = node;
    for (let i = 0; i < LIMITS.maxDepth + 5; i++) {
      node.a = {};
      node = node.a;
    }
    const r = await post({ before: baseSpec(), after: s });
    expect(r.status).toBe(422);
    expect(code(r)).toBe("SPEC_TOO_COMPLEX");
  });
  it("rejects $ref bombs (exponential expansion) quickly", async () => {
    const bomb = (depth: number) => {
      const schemas: Record<string, any> = {};
      for (let i = 0; i < depth; i++) {
        schemas[`S${i}`] = {
          type: "object",
          properties: {
            a: { $ref: `#/components/schemas/S${i + 1}` },
            b: { $ref: `#/components/schemas/S${i + 1}` },
          },
        };
      }
      schemas[`S${depth}`] = { type: "string" };
      const s = clone(baseSpec());
      s.components = { schemas };
      s.paths["/users"].get.responses["200"].content["application/json"].schema = {
        $ref: "#/components/schemas/S0",
      };
      return s;
    };
    const started = Date.now();
    const r = await post({ before: baseSpec(), after: bomb(30) });
    expect(r.status).toBe(422);
    expect(code(r)).toBe("SPEC_TOO_COMPLEX");
    expect(Date.now() - started).toBeLessThan(2_000);
  });
  it("accepts circular $refs", async () => {
    const s = clone(baseSpec());
    s.components = {
      schemas: { Node: { type: "object", properties: { child: { $ref: "#/components/schemas/Node" } } } },
    };
    s.paths["/users"].get.responses["200"].content["application/json"].schema = {
      $ref: "#/components/schemas/Node",
    };
    const t = clone(s);
    t.components.schemas.Node.properties.name = { type: "string" };
    const r = await post({ before: s, after: t });
    expect(r.status).toBe(200);
    expect(r.json.changes.some((c: any) => c.kind === "property_added")).toBe(true);
  });
});

describe("external references are never fetched", () => {
  it("reports external $refs as a limitation and makes no network call", async () => {
    const original = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error("network must not be used");
    }) as unknown as typeof fetch;
    try {
      const s = clone(baseSpec());
      s.paths["/users"].get.responses["200"].content["application/json"].schema = {
        $ref: "https://169.254.169.254/latest/meta-data",
      };
      const t = clone(s);
      t.paths["/users"].get.responses["200"].content["application/json"].schema = {
        $ref: "https://evil.example/schema.json",
      };
      const r = await post({ before: s, after: t });
      expect(r.status).toBe(200);
      expect(called).toBe(false);
      expect(r.json.limitations.join(" ")).toMatch(/External \$refs are never fetched/);
      expect(
        r.json.changes.some((c: any) => c.kind === "reference_changed" && c.compatibility === "unknown"),
      ).toBe(true);
    } finally {
      globalThis.fetch = original;
    }
  });
});

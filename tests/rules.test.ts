import { describe, expect, it } from "vitest";
import type { Change } from "../src/core/classify";
import { diffAfter, type Spec } from "./helpers";

const RESP = (s: Spec) => s.paths["/users"].get.responses["200"].content["application/json"].schema;
const REQ = (s: Spec) => s.paths["/users"].post.requestBody.content["application/json"].schema;

async function single(mutate: (s: Spec) => void): Promise<Change> {
  const r = await diffAfter(mutate);
  const contract = r.changes.filter((c) => c.compatibility !== "non_contract");
  expect(contract, JSON.stringify(r.changes, null, 1)).toHaveLength(1);
  return contract[0] as Change;
}

function expectChange(
  c: Change,
  kind: string,
  compatibility: Change["compatibility"],
  direction?: Change["direction"],
) {
  expect(c.kind).toBe(kind);
  expect(c.compatibility).toBe(compatibility);
  if (direction) expect(c.direction).toBe(direction);
  expect(c.rule).toBe(`${c.direction}.${c.kind}`);
  expect(c.reason.length).toBeGreaterThan(10);
  expect(c.recommended_action.length).toBeGreaterThan(5);
  expect(c.reason).not.toMatch(/will break/i);
}

describe("operations", () => {
  it("removed operation is breaking", async () => {
    const c = await single((s) => delete s.paths["/users"].post);
    expectChange(c, "operation_removed", "breaking", "operation");
    expect(c.operation).toEqual({ method: "POST", path: "/users" });
  });
  it("removed path reports each operation", async () => {
    const r = await diffAfter((s) => delete s.paths["/users"]);
    expect(r.changes.map((c) => `${c.kind}:${c.operation?.method}`).sort()).toEqual([
      "operation_removed:GET",
      "operation_removed:POST",
    ]);
  });
  it("added operation is compatible", async () => {
    const c = await single(
      (s) => (s.paths["/health"] = { get: { responses: { "200": { description: "ok" } } } }),
    );
    expectChange(c, "operation_added", "compatible", "operation");
  });
  it("deprecation is compatible; operationId change is potentially breaking", async () => {
    expectChange(
      await single((s) => (s.paths["/users"].get.deprecated = true)),
      "operation_deprecated",
      "compatible",
    );
    const c = await single((s) => (s.paths["/users"].get.operationId = "listUsers2"));
    expectChange(c, "operation_id_changed", "potentially_breaking");
  });
  it("description-only changes are non_contract", async () => {
    const r = await diffAfter((s) => {
      s.paths["/users"].get.description = "new words";
      s.info.version = "2.0.0";
    });
    expect(r.changes.every((c) => c.compatibility === "non_contract")).toBe(true);
    expect(r.compatibility).toBe("compatible");
  });
});

describe("parameters (request side)", () => {
  it("new required parameter is potentially breaking; optional is compatible", async () => {
    const req = await single((s) =>
      s.paths["/users"].get.parameters.push({
        name: "region",
        in: "query",
        required: true,
        schema: { type: "string" },
      }),
    );
    expectChange(req, "required_parameter_added", "potentially_breaking", "request");
    expect(req.location).toEqual({ in: "query", name: "region" });
    const opt = await single((s) =>
      s.paths["/users"].get.parameters.push({ name: "limit", in: "query", schema: { type: "integer" } }),
    );
    expectChange(opt, "optional_parameter_added", "compatible", "request");
  });
  it("removed parameter is potentially breaking", async () => {
    expectChange(
      await single((s) => (s.paths["/users"].get.parameters = [])),
      "parameter_removed",
      "potentially_breaking",
      "request",
    );
  });
  it("optional → required is potentially breaking; required → optional is compatible", async () => {
    expectChange(
      await single((s) => (s.paths["/users"].get.parameters[0].required = true)),
      "parameter_became_required",
      "potentially_breaking",
    );
  });
  it("parameter schema type change is potentially breaking", async () => {
    const c = await single((s) => (s.paths["/users"].get.parameters[0].schema.type = "integer"));
    expectChange(c, "type_changed", "potentially_breaking", "request");
    expect(c.location).toMatchObject({ in: "query", name: "q", keyword: "type" });
  });
  it("path-level parameters are attributed to each operation by name", async () => {
    const r = await diffAfter(
      (s) =>
        (s.paths["/users"].parameters = [
          { name: "X-Tenant", in: "header", required: true, schema: { type: "string" } },
        ]),
    );
    const kinds = r.changes.map((c) => `${c.operation?.method}:${c.kind}:${c.location.name}`).sort();
    expect(kinds).toEqual([
      "GET:required_parameter_added:X-Tenant",
      "POST:required_parameter_added:X-Tenant",
    ]);
  });
  it("serialization change is potentially breaking", async () => {
    expectChange(
      await single((s) => (s.paths["/users"].get.parameters[0].style = "pipeDelimited")),
      "parameter_serialization_changed",
      "potentially_breaking",
    );
  });
});

describe("request body and request schemas", () => {
  it("request body optional → required and required → optional", async () => {
    expectChange(
      await single((s) => (s.paths["/users"].post.requestBody.required = false)),
      "request_body_became_optional",
      "compatible",
      "request",
    );
  });
  it("narrowing accepted values is potentially breaking", async () => {
    expectChange(
      await single((s) => (REQ(s).properties.name.maxLength = 10)),
      "constraint_narrowed",
      "potentially_breaking",
      "request",
    );
    expectChange(
      await single((s) => (REQ(s).properties.age.minimum = 18)),
      "constraint_narrowed",
      "potentially_breaking",
      "request",
    );
    expectChange(
      await single((s) => REQ(s).properties.role.enum.pop()),
      "enum_value_removed",
      "potentially_breaking",
      "request",
    );
    expectChange(
      await single((s) => (REQ(s).properties.name.pattern = "^[a-z]+$")),
      "constraint_narrowed",
      "potentially_breaking",
      "request",
    );
  });
  it("widening accepted values is compatible", async () => {
    expectChange(
      await single((s) => (REQ(s).properties.name.maxLength = 500)),
      "constraint_widened",
      "compatible",
      "request",
    );
    expectChange(
      await single((s) => REQ(s).properties.role.enum.push("guest")),
      "enum_value_added",
      "compatible",
      "request",
    );
    expectChange(
      await single((s) => (REQ(s).properties.age.type = "number")),
      "type_changed",
      "compatible",
      "request",
    );
  });
  it("new required property is potentially breaking", async () => {
    const r = await diffAfter((s) => {
      REQ(s).properties.email = { type: "string" };
      REQ(s).required.push("email");
    });
    const kinds = r.changes.map((c) => `${c.kind}:${c.compatibility}`).sort();
    expect(kinds).toEqual(["property_added:compatible", "property_became_required:potentially_breaking"]);
  });
  it("property no longer required is compatible on the request side", async () => {
    expectChange(
      await single((s) => (REQ(s).required = [])),
      "property_became_optional",
      "compatible",
      "request",
    );
  });
  it("removed request property is potentially breaking", async () => {
    expectChange(
      await single((s) => delete REQ(s).properties.age),
      "property_removed",
      "potentially_breaking",
      "request",
    );
  });
  it("media type swap: removed type is potentially breaking, added type is compatible", async () => {
    const r = await diffAfter((s) => {
      const body = s.paths["/users"].post.requestBody.content;
      body["application/xml"] = body["application/json"];
      delete body["application/json"];
    });
    expect(r.changes.map((c) => `${c.kind}:${c.location.media_type}:${c.compatibility}`).sort()).toEqual([
      "request_media_type_added:application/xml:compatible",
      "request_media_type_removed:application/json:potentially_breaking",
    ]);
  });
  it("request default change is potentially breaking", async () => {
    expectChange(
      await single((s) => (REQ(s).properties.role.default = "admin")),
      "default_changed",
      "potentially_breaking",
      "request",
    );
  });
});

describe("responses and response schemas", () => {
  it("removed response property is potentially breaking", async () => {
    const c = await single((s) => delete RESP(s).properties.email);
    expectChange(c, "property_removed", "potentially_breaking", "response");
    expect(c.location).toMatchObject({ status: "200", media_type: "application/json", field: "email" });
  });
  it("added optional response property is compatible", async () => {
    expectChange(
      await single((s) => (RESP(s).properties.nickname = { type: "string" })),
      "property_added",
      "compatible",
      "response",
    );
  });
  it("response enum value added is potentially breaking; removed is compatible", async () => {
    expectChange(
      await single((s) => RESP(s).properties.status.enum.push("pending")),
      "enum_value_added",
      "potentially_breaking",
      "response",
    );
    expectChange(
      await single((s) => RESP(s).properties.status.enum.pop()),
      "enum_value_removed",
      "compatible",
      "response",
    );
  });
  it("response field no longer guaranteed is potentially breaking", async () => {
    expectChange(
      await single((s) => (RESP(s).required = [])),
      "property_became_optional",
      "potentially_breaking",
      "response",
    );
  });
  it("response constraint widened is potentially breaking; narrowed is compatible", async () => {
    expectChange(
      await single((s) => (RESP(s).properties.email.maxLength = 500)),
      "constraint_widened",
      "potentially_breaking",
      "response",
    );
    expectChange(
      await single((s) => (RESP(s).properties.email.maxLength = 10)),
      "constraint_narrowed",
      "compatible",
      "response",
    );
  });
  it("response nullable added is potentially breaking", async () => {
    expectChange(
      await single((s) => (RESP(s).properties.email.nullable = true)),
      "constraint_widened",
      "potentially_breaking",
      "response",
    );
  });
  it("success status removed is potentially breaking; error status removed is compatible", async () => {
    const r = await diffAfter((s) => {
      s.paths["/users"].post.responses = { "202": { description: "accepted" } };
    });
    const kinds = r.changes.map((c) => `${c.kind}:${c.location.status}:${c.compatibility}`).sort();
    expect(kinds).toEqual([
      "response_status_added:202:compatible",
      "response_status_removed:201:potentially_breaking",
    ]);
    expectChange(
      await single((s) => delete s.paths["/users"].get.responses["404"]),
      "response_status_removed",
      "compatible",
      "response",
    );
  });
  it("response header removed is potentially breaking", async () => {
    const start = (s: Spec) =>
      (s.paths["/users"].get.responses["200"].headers = { "X-Rate": { schema: { type: "integer" } } });
    const { baseSpec } = await import("./helpers");
    const b = baseSpec();
    start(b);
    const r = await diffAfter((s) => delete s.paths["/users"].get.responses["200"].headers, b);
    expect(r.changes.map((c) => `${c.kind}:${c.compatibility}`)).toEqual([
      "response_header_removed:potentially_breaking",
    ]);
  });
  it("changes inside array items are located with [] notation", async () => {
    const r = await diffAfter((s) => {
      RESP(s).properties.tags = {
        type: "array",
        items: { type: "object", properties: { id: { type: "string" } } },
      };
    });
    expect(r.changes[0]?.kind).toBe("property_added");
    const { baseSpec } = await import("./helpers");
    const b = baseSpec();
    RESP(b).properties.tags = {
      type: "array",
      items: { type: "object", properties: { id: { type: "string" } } },
    };
    const r2 = await diffAfter((s) => delete RESP(s).properties.tags.items.properties.id, b);
    expect(r2.changes[0]?.location.field).toBe("tags[].id");
  });
});

describe("security", () => {
  it("authentication added to an operation is potentially breaking (scheme definition itself is compatible)", async () => {
    const r = await diffAfter((s) => {
      s.components = { securitySchemes: { key: { type: "apiKey", in: "header", name: "X-Key" } } };
      s.paths["/users"].get.security = [{ key: [] }];
    });
    expect(r.changes.map((c) => `${c.kind}:${c.compatibility}`).sort()).toEqual([
      "security_requirement_added:potentially_breaking",
      "security_scheme_added:compatible",
    ]);
    const req = r.changes.find((c) => c.kind === "security_requirement_added") as Change;
    expectChange(req, "security_requirement_added", "potentially_breaking", "security");
    expect(req.operation).toEqual({ method: "GET", path: "/users" });
  });
  it("global authentication added is potentially breaking and document-wide", async () => {
    const r = await diffAfter((s) => {
      s.components = { securitySchemes: { key: { type: "apiKey", in: "header", name: "X-Key" } } };
      s.security = [{ key: [] }];
    });
    const req = r.changes.find((c) => c.kind === "security_requirement_added") as Change;
    expectChange(req, "security_requirement_added", "potentially_breaking", "security");
    expect(req.operation).toBeNull();
  });
  it("removing authentication is compatible; adding an alternative is compatible", async () => {
    const { baseSpec } = await import("./helpers");
    const b = baseSpec();
    b.components = {
      securitySchemes: {
        key: { type: "apiKey", in: "header", name: "X-Key" },
        tok: { type: "http", scheme: "bearer" },
      },
    };
    b.security = [{ key: [] }];
    expect((await diffAfter((s) => delete s.security, b)).changes.map((c) => c.compatibility)).toEqual([
      "compatible",
    ]);
    expect(
      (await diffAfter((s) => s.security.push({ tok: [] }), b)).changes.map(
        (c) => `${c.kind}:${c.compatibility}`,
      ),
    ).toEqual(["security_alternative_added:compatible"]);
  });
  it("changing a security scheme is potentially breaking", async () => {
    const { baseSpec } = await import("./helpers");
    const b = baseSpec();
    b.components = { securitySchemes: { key: { type: "apiKey", in: "header", name: "X-Key" } } };
    b.security = [{ key: [] }];
    const r = await diffAfter((s) => (s.components.securitySchemes.key.name = "X-Api-Key"), b);
    expect(r.changes.map((c) => `${c.kind}:${c.compatibility}:${c.location.name}`)).toEqual([
      "security_scheme_changed:potentially_breaking:key",
    ]);
  });
});

describe("unsupported constructs are reported, never silently ignored", () => {
  it("discriminator change is unknown", async () => {
    const r = await diffAfter((s) => (RESP(s).discriminator = { propertyName: "status" }));
    expect(r.changes.map((c) => c.compatibility)).toContain("unknown");
    expect(r.compatibility).toBe("unknown");
  });
  it("callbacks change is unknown", async () => {
    const r = await diffAfter(
      (s) =>
        (s.paths["/users"].post.callbacks = {
          cb: { "{$request.body#/url}": { post: { responses: { "200": { description: "ok" } } } } },
        }),
    );
    expect(r.changes.some((c) => c.kind === "callbacks_changed" && c.compatibility === "unknown")).toBe(true);
  });
});

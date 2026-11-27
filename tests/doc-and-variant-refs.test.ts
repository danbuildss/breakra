/** D-050 PR 2 (Orric #2, #3, #4): documentation nested in example/x-*, and $ref options inside anyOf/oneOf. */
import { describe, expect, it } from "vitest";
import { analyze } from "../src/analyze";
import { inlineLeafVariantRefs } from "../src/core/compare";
import type { JsonObject } from "../src/core/validate";

const doc = (props: Record<string, unknown>, schemas: Record<string, unknown> = {}): JsonObject =>
  ({
    openapi: "3.0.3",
    info: { title: "t", version: "1" },
    components: { schemas },
    paths: {
      "/x": {
        post: {
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: props } } },
          },
          responses: { "200": { description: "ok" } },
        },
      },
    },
  }) as unknown as JsonObject;
const rules = async (b: JsonObject, a: JsonObject) => {
  const r = await analyze({ before: b, after: a });
  return { verdict: r.verdict, rules: r.changes.map((c) => `${c.rule}/${c.compatibility}`) };
};

describe("documentation nested in example and x-* (Orric #3, #4)", () => {
  it("changes inside an example or an x-* extension are documentation only", async () => {
    expect(
      await rules(
        doc({ a: { type: "string", example: { k: "a" } } }),
        doc({ a: { type: "string", example: { k: "b" } } }),
      ),
    ).toEqual({
      verdict: "safe",
      rules: ["request.schema_documentation_changed/non_contract"],
    });
    expect(
      await rules(
        doc({ a: { type: "string", "x-vals": ["a"] } }),
        doc({ a: { type: "string", "x-vals": ["a", "b"] } }),
      ),
    ).toEqual({
      verdict: "safe",
      rules: ["request.schema_documentation_changed/non_contract"],
    });
  });
  it("a property NAMED x-… is still part of the contract", async () => {
    const r = await rules(
      doc({ "x-request-id": { type: "string" } }),
      doc({ "x-request-id": { type: "integer" } }),
    );
    expect(r.verdict).toBe("review");
    expect(r.rules).toContain("request.type_changed/potentially_breaking");
  });
});

describe("$ref options inside anyOf/oneOf (Orric #2)", () => {
  const field = { anyOf: [{ $ref: "#/components/schemas/F" }, { type: "null" }] };
  it("an inline enum moved to a larger shared enum only adds a value", async () => {
    const r = await rules(
      doc({ f: { anyOf: [{ type: "string", enum: ["png", "jpeg"] }, { type: "null" }] } }),
      doc({ f: field }, { F: { type: "string", enum: ["png", "jpeg", "svg"] } }),
    );
    expect(r).toEqual({ verdict: "safe", rules: ["request.enum_value_added/compatible"] });
  });
  it("a real narrowing behind the shared $ref is still caught", async () => {
    const r = await rules(
      doc({ f: field }, { F: { type: "string", enum: ["png", "jpeg"] } }),
      doc({ f: field }, { F: { type: "string", enum: ["png"] } }),
    );
    expect(r.verdict).toBe("review");
    expect(r.rules).toContain("request.enum_value_removed/potentially_breaking");
  });
  it("only inlines leaf targets: recursive and nested-$ref targets stay references", () => {
    const d = doc(
      { t: { oneOf: [{ $ref: "#/components/schemas/Node" }, { $ref: "#/components/schemas/Leaf" }] } },
      {
        Node: { type: "object", properties: { next: { $ref: "#/components/schemas/Node" } } },
        Leaf: { type: "string" },
      },
    );
    const out = inlineLeafVariantRefs(structuredClone(d)) as any;
    const variants = out.paths["/x"].post.requestBody.content["application/json"].schema.properties.t.oneOf;
    expect(variants[0]).toEqual({ $ref: "#/components/schemas/Node" });
    expect(variants[1]).toEqual({ type: "string" });
  });
});

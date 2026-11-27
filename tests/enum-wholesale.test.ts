/** D-050 (Orric #14): an enum introduced or dropped as a whole is one finding, rated by direction. */
import { describe, expect, it } from "vitest";
import { analyze } from "../src/analyze";
import type { JsonObject } from "../src/core/validate";

type Where = "request" | "response";
const doc = (schema: Record<string, unknown>, where: Where, version = "3.0.3"): JsonObject =>
  ({
    openapi: version,
    info: { title: "t", version: "1" },
    paths: {
      "/x": {
        post: {
          ...(where === "request"
            ? {
                requestBody: {
                  required: true,
                  content: { "application/json": { schema: { type: "object", properties: { s: schema } } } },
                },
              }
            : {}),
          responses: {
            "200": {
              description: "ok",
              ...(where === "response"
                ? {
                    content: {
                      "application/json": { schema: { type: "object", properties: { s: schema } } },
                    },
                  }
                : {}),
            },
          },
        },
      },
    },
  }) as unknown as JsonObject;
const run = async (where: Where, before: Record<string, unknown>, after: Record<string, unknown>) => {
  const r = await analyze({ before: doc(before, where), after: doc(after, where) });
  return { verdict: r.verdict, changes: r.changes.filter((c) => c.compatibility !== "non_contract") };
};
const plain = { type: "string" };
const ab = { type: "string", enum: ["a", "b"] };

describe("enum introduced or dropped as a whole (D-050)", () => {
  it("request: introducing an enum restricts callers (was a false SAFE)", async () => {
    const r = await run("request", plain, ab);
    expect(r.verdict).toBe("review");
    expect(r.changes).toHaveLength(1);
    expect(r.changes[0]).toMatchObject({
      rule: "request.enum_introduced",
      compatibility: "potentially_breaking",
    });
    expect(r.changes[0]?.evidence).toMatchObject({ before: null, after: ["a", "b"] });
  });
  it("response: introducing an enum narrows what consumers receive", async () => {
    const r = await run("response", plain, ab);
    expect(r.verdict).toBe("safe");
    expect(r.changes).toEqual([
      expect.objectContaining({ rule: "response.enum_introduced", compatibility: "compatible" }),
    ]);
  });
  it("request: dropping the enum lets callers send anything (was a false REVIEW)", async () => {
    const r = await run("request", ab, plain);
    expect(r.verdict).toBe("safe");
    expect(r.changes).toEqual([
      expect.objectContaining({ rule: "request.enum_removed", compatibility: "compatible" }),
    ]);
  });
  it("response: dropping the enum may return values consumers don't expect", async () => {
    const r = await run("response", ab, plain);
    expect(r.verdict).toBe("review");
    expect(r.changes).toEqual([
      expect.objectContaining({ rule: "response.enum_removed", compatibility: "potentially_breaking" }),
    ]);
  });
  it("an existing enum still reports values one by one", async () => {
    const added = await run("request", { type: "string", enum: ["a"] }, ab);
    expect(added.changes).toEqual([
      expect.objectContaining({ rule: "request.enum_value_added", compatibility: "compatible" }),
    ]);
    const removed = await run("request", ab, { type: "string", enum: ["a"] });
    expect(removed.changes).toEqual([
      expect.objectContaining({ rule: "request.enum_value_removed", compatibility: "potentially_breaking" }),
    ]);
  });
});

describe("OpenAPI 3.1.2 (D-050, Orric #1)", () => {
  it("is accepted; unknown later versions still fail closed", async () => {
    expect(
      (await analyze({ before: doc(plain, "request", "3.1.2"), after: doc(plain, "request", "3.1.2") }))
        .verdict,
    ).toBe("safe");
    await expect(
      analyze({ before: doc(plain, "request", "3.1.3"), after: doc(plain, "request", "3.1.3") }),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_OPENAPI_VERSION",
    });
  });
});

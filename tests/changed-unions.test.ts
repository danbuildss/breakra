/** D-050 PR 3 (Orric #16): a large oneOf/anyOf whose options are replaced is refused fast instead of running for minutes. */
import { describe, expect, it } from "vitest";
import { analyze } from "../src/analyze";
import { BreakraError } from "../src/core/errors";
import { HOSTED_LIMITS, LOCAL_LIMITS } from "../src/core/limits";
import { checkChangedUnions } from "../src/core/validate";
import { analyzeLocal } from "../src/local";

type Doc = Record<string, any>;

/** An event-style union: `n` object options, each with its own `type` constant and a payload field. */
const option = (i: number, note = "") => ({
  type: "object",
  required: ["type"],
  properties: {
    type: { type: "string", enum: [`event.${i}`] },
    data: { type: "string", description: `payload ${i}${note}` },
  },
});

function spec(options: Doc[], version = "1"): Doc {
  return {
    openapi: "3.0.3",
    info: { title: "events", version },
    paths: {
      "/events": {
        get: {
          responses: {
            "200": {
              description: "ok",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Event" } } },
            },
          },
        },
      },
    },
    components: { schemas: { Event: { oneOf: options } } },
  };
}

const range = (from: number, to: number, note = "") =>
  Array.from({ length: to - from }, (_, k) => option(from + k, note));

const refusal = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e as BreakraError;
  }
  return undefined;
};

describe("changed-union guard", () => {
  it("refuses a large union with options both replaced and added, naming the size and the bound", () => {
    const before = spec(range(0, 70));
    const after = spec([...range(0, 69), option(69, " (edited)"), option(70)], "2");
    const e = refusal(() => checkChangedUnions(before, after, LOCAL_LIMITS));
    expect(e).toBeInstanceOf(BreakraError);
    expect(e?.code).toBe("SPEC_TOO_COMPLEX");
    expect(e?.details).toEqual({ limit_changed_union_options: 64, union_options: 71 });
    expect(e?.message).toMatch(/71 options .* above 64 options\. Compare only the paths you use/);
  });

  it("allows a large union that only gains options, only loses options, or is unchanged", () => {
    const base = range(0, 100);
    for (const after of [range(0, 140), range(0, 70), range(0, 100)])
      expect(refusal(() => checkChangedUnions(spec(base), spec(after, "2"), LOCAL_LIMITS))).toBeUndefined();
  });

  it("allows any change in a union at or under the bound", () => {
    const before = spec(range(0, 24));
    const after = spec([...range(0, 23), option(23, " (edited)")], "2");
    expect(refusal(() => checkChangedUnions(before, after, HOSTED_LIMITS))).toBeUndefined();
  });

  it("end to end: hosted refuses above 24 options, local analyzes up to 64", async () => {
    const before = spec(range(0, 30));
    const after = spec([...range(0, 29), option(29, " (edited)")], "2");
    await expect(analyze({ before, after })).rejects.toMatchObject({ code: "SPEC_TOO_COMPLEX" });
    const r = await analyzeLocal(before, after);
    expect(r.verdict).toBe("safe");
    expect(r.changes.some((c) => c.compatibility === "non_contract")).toBe(true);
  });

  it("refuses quickly, before the diff library runs", async () => {
    const before = spec(range(0, 140));
    const after = spec([...range(0, 120, " (edited)"), ...range(120, 150)], "2");
    const t = performance.now();
    await expect(analyzeLocal(before, after)).rejects.toMatchObject({ code: "SPEC_TOO_COMPLEX" });
    expect(performance.now() - t).toBeLessThan(2_000);
  });
});

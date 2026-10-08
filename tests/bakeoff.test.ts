import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson } from "../src/core/canonical";
import { baseSpec, clone, compare, type Spec } from "./helpers";

const load = (name: string): Spec =>
  JSON.parse(readFileSync(join(__dirname, "fixtures/bakeoff", name), "utf8"));

/** The 14 deliberate changes from the Phase 0 engine bake-off (AUDIT.md §3), with the rule set 0.1.0 verdicts. */
const EXPECTED = [
  "breaking|operation|DELETE /items/{id}|operation_removed",
  "potentially_breaking|request|POST /orders|enum_value_removed",
  "potentially_breaking|request|POST /orders|property_became_required",
  "potentially_breaking|request|POST /orders|type_changed",
  "potentially_breaking|response|GET /orders/{id}|enum_value_added",
  "potentially_breaking|security|GET /reports|security_requirement_added",
  "potentially_breaking|request|GET /users|required_parameter_added",
  "potentially_breaking|response|GET /users/{id}|property_removed",
  "potentially_breaking|response|GET /users/{id}|response_media_type_removed",
  "compatible|operation|GET /status|operation_added",
  "compatible|request|GET /users|optional_parameter_added",
  "compatible|response|GET /users/{id}|property_added",
  "compatible|response|GET /users/{id}|response_status_removed",
  "non_contract|document|-|document_metadata_changed",
  "non_contract|operation|GET /users|operation_documentation_changed",
];

describe("Phase 0 bake-off fixture (14 changes)", () => {
  it("detects and classifies every change", async () => {
    const r = await compare(load("before.json"), load("after.json"));
    const got = r.changes.map(
      (c) =>
        `${c.compatibility}|${c.direction}|${c.operation ? `${c.operation.method} ${c.operation.path}` : "-"}|${c.kind}`,
    );
    expect(got).toEqual(EXPECTED);
    expect(r.compatibility).toBe("breaking");
    expect(r.summary).toEqual({
      total_changes: 15,
      breaking: 1,
      potentially_breaking: 8,
      unknown: 0,
      compatible: 4,
      non_contract: 2,
    });
  });
  it("every finding carries evidence and an action", async () => {
    const r = await compare(load("before.json"), load("after.json"));
    for (const c of r.changes) {
      expect(c.evidence.path.length).toBeGreaterThan(0);
      expect(c.evidence.before !== null || c.evidence.after !== null).toBe(true);
      expect(c.recommended_action).toBeTruthy();
      expect(c.id).toMatch(/^change-\d{3}$/);
    }
  });
});

describe("determinism", () => {
  const strip = (r: Awaited<ReturnType<typeof compare>>) => ({
    ...r,
    metadata: { ...r.metadata, duration_ms: 0 },
  });

  it("same input gives byte-identical output and analysis_id", async () => {
    const a = strip(await compare(load("before.json"), load("after.json")));
    const b = strip(await compare(load("before.json"), load("after.json")));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.analysis_id).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
  it("reordered keys and reformatted JSON give identical results", async () => {
    const before = load("before.json");
    const after = load("after.json");
    const shuffled = (s: Spec): Spec => {
      const out: Spec = {};
      for (const k of Object.keys(s).reverse()) out[k] = s[k];
      return out;
    };
    const a = strip(await compare(before, after));
    const b = strip(await compare(shuffled(before), JSON.parse(JSON.stringify(shuffled(after), null, 4))));
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
  it("identical documents produce no changes", async () => {
    const r = await compare(baseSpec(), clone(baseSpec()));
    expect(r.changes).toEqual([]);
    expect(r.compatibility).toBe("compatible");
    expect(r.summary.total_changes).toBe(0);
  });
  it("enum reordering is not a change", async () => {
    const a = baseSpec();
    const b = clone(a);
    b.paths["/users"].get.responses["200"].content[
      "application/json"
    ].schema.properties.status.enum.reverse();
    expect((await compare(a, b)).changes).toEqual([]);
  });
  it("input hashes are of canonical JSON", async () => {
    const r = await compare(baseSpec(), baseSpec());
    expect(r.metadata.input_hashes.before).toBe(r.metadata.input_hashes.after);
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });
});

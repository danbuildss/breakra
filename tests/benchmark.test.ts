/** Benchmark (PR D): curated scenarios give their expected outcome; real-history results are honest. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyze } from "../src/analyze";
import { BreakraError } from "../src/core/errors";

const dir = join(__dirname, "../benchmark");
const results = JSON.parse(readFileSync(join(dir, "results.json"), "utf8"));

describe("curated scenarios", () => {
  for (const f of readdirSync(join(dir, "curated"))
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    it(f, async () => {
      const c = JSON.parse(readFileSync(join(dir, "curated", f), "utf8"));
      if (c.expect.error) {
        await expect(analyze({ before: c.before, after: c.after })).rejects.toBeInstanceOf(BreakraError);
        await expect(analyze({ before: c.before, after: c.after })).rejects.toMatchObject({
          code: c.expect.error,
        });
        return;
      }
      const r = await analyze({ before: c.before, after: c.after });
      expect(r.verdict).toBe(c.expect.verdict);
      for (const rule of c.expect.rules ?? []) expect(r.changes.map((x) => x.rule)).toContain(rule);
      if (c.expect.limitation !== undefined) expect(r.limitations.length > 0).toBe(c.expect.limitation);
    });
  }
  it("results.json records every curated case as passing", () => {
    expect(results.curated.passed).toBe(results.curated.total);
  });
});

describe("real-history results", () => {
  it("never reports 'safe' for a pair where nothing could be compared", () => {
    for (const c of results.real.cases) {
      if (c.changed_paths_total > 0 && c.paths_compared === 0) expect(c.verdict).toBe("not_assessed");
      if (c.verdict === "safe") expect(c.paths_compared).toBeGreaterThan(0);
    }
  });
  it("records input hashes so results can be reproduced", () => {
    for (const c of results.real.cases.filter((x: { summary?: unknown }) => x.summary))
      expect(c.input_hashes.before).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

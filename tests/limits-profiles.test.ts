/** D-049: the hosted API keeps Bankr-sized limits; the local tools (CLI, MCP, Action) accept GitHub-scale specs. */
import { mkdtempSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyze } from "../src/analyze";
import { HOSTED_LIMITS, LIMITS, LOCAL_LIMITS } from "../src/core/limits";
import { analyzeLocal, readSpecFile } from "../src/local";

type Doc = Record<string, any>;

/** One shared schema of `props` properties, used by `ops` operations: about ops × 2 × props nodes once expanded. */
function wide(ops: number, props: number, version = "1"): Doc {
  const properties: Doc = {};
  for (let i = 0; i < props; i++) properties[`p${i}`] = { type: "string" };
  const paths: Doc = {};
  for (let i = 0; i < ops; i++) {
    paths[`/r${i}`] = {
      get: {
        responses: {
          "200": {
            description: "ok",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Big" } } },
          },
        },
      },
    };
  }
  return {
    openapi: "3.0.3",
    info: { title: "wide", version },
    components: { schemas: { Big: { type: "object", properties } } },
    paths,
  };
}

/** Each level references the next twice, so expansion doubles per level: a $ref bomb. */
function refBomb(depth: number): Doc {
  const schemas: Doc = {};
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
  const ok = {
    description: "ok",
    content: { "application/json": { schema: { $ref: "#/components/schemas/S0" } } },
  };
  return {
    openapi: "3.0.3",
    info: { title: "bomb", version: "1" },
    components: { schemas },
    paths: { "/x": { get: { responses: { "200": ok } } } },
  };
}

const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return "ok";
  } catch (e) {
    return (e as { code?: string }).code;
  }
};

describe("limits profiles (D-049)", () => {
  it("hosted limits are unchanged; local raises only the input bounds", () => {
    expect(HOSTED_LIMITS).toBe(LIMITS);
    expect(LIMITS).toMatchObject({
      maxBodyBytes: 1024 * 1024,
      maxNodes: 300_000,
      maxOperations: 5_000,
      maxExpandedNodes: 75_000,
    });
    expect(LOCAL_LIMITS).toMatchObject({
      maxBodyBytes: 25 * 1024 * 1024,
      maxNodes: 2_000_000,
      maxOperations: 20_000,
      maxExpandedNodes: 5_000_000,
    });
    for (const k of ["maxDepth", "maxChanges", "maxEvidenceChars"] as const)
      expect(LOCAL_LIMITS[k]).toBe(LIMITS[k]);
  });

  it("a spec over the hosted expanded-node bound is refused by the API path and analyzed locally", async () => {
    const before = wide(60, 1000);
    const after = wide(60, 1000, "2");
    delete after.paths["/r0"];
    expect(await code(analyze({ before, after }))).toBe("SPEC_TOO_COMPLEX");
    const r = await analyzeLocal(before, after);
    expect(r.verdict).toBe("block");
    expect(r.summary.breaking).toBe(1);
  });

  it("over 5,000 operations: hosted refuses, local accepts", async () => {
    const big = wide(5_200, 1);
    expect(await code(analyze({ before: big, after: big }))).toBe("SPEC_TOO_COMPLEX");
    expect((await analyzeLocal(big, big)).verdict).toBe("safe");
  });

  it("$ref bombs are still refused locally, with a hint", async () => {
    const bomb = refBomb(30);
    await expect(analyzeLocal(bomb, bomb)).rejects.toMatchObject({
      code: "SPEC_TOO_COMPLEX",
      message: expect.stringContaining("Compare only the paths you use"),
    });
  });

  it("analysis_id is identical under both profiles", async () => {
    const before = wide(3, 2);
    const after = wide(3, 2, "2");
    delete after.paths["/r1"];
    const hosted = await analyze({ before, after });
    const local = await analyzeLocal(before, after);
    expect(local.analysis_id).toBe(hosted.analysis_id);
    expect(local.changes).toEqual(hosted.changes);
  });

  it("local files: a 2 MB file is read, a file over 25 MB is refused before reading", () => {
    const dir = mkdtempSync(join(tmpdir(), "breakra-limits-"));
    const mid = join(dir, "mid.json");
    const spec = wide(1, 1);
    spec.info.description = "x".repeat(2 * 1024 * 1024);
    writeFileSync(mid, JSON.stringify(spec));
    expect(readSpecFile(mid, "before").info).toBeDefined();
    const huge = join(dir, "huge.json");
    writeFileSync(huge, "");
    truncateSync(huge, 25 * 1024 * 1024 + 1); // sparse: no 25 MB written
    expect(() => readSpecFile(huge, "before")).toThrow(/exceeds 25 MB/);
  });
});

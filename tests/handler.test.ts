import { afterEach, describe, expect, it, vi } from "vitest";
import { baseSpec, clone, post } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("../src/core/compare");
});

describe("handler", () => {
  it("returns 200 with the documented shape for a valid request", async () => {
    const after = clone(baseSpec());
    delete after.paths["/users"].post;
    const r = await post({ before: baseSpec(), after });
    expect(r.status).toBe(200);
    expect(Object.keys(r.json).sort()).toEqual(
      [
        "analysis_id",
        "changes",
        "compatibility",
        "engine_version",
        "limitations",
        "metadata",
        "rule_set_version",
        "spec_versions",
        "status",
        "summary",
      ].sort(),
    );
    expect(r.json.engine_version).toBe("0.1.0");
    expect(r.json.rule_set_version).toBe("0.1.0");
    expect(r.json.spec_versions).toEqual({ before: "3.0.3", after: "3.0.3" });
  });

  it("logs one line per request with no body content and no client IP", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const secret = clone(baseSpec());
    secret.info.description = "SECRET-SPEC-CONTENT";
    await post(
      { before: baseSpec(), after: secret },
      { headers: { "x-402-payer": "0xPAYER", "x-forwarded-for": "203.0.113.9" } },
    );
    const lines = spy.mock.calls.map((c) => String(c[0]));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('"payer":"0xPAYER"');
    expect(lines[0]).not.toMatch(/SECRET-SPEC-CONTENT|203\.0\.113\.9/);
  });

  it("an unexpected internal failure returns a sanitized 500, never 2xx", async () => {
    vi.doMock("../src/core/compare", () => ({
      compareSpecs: () => {
        throw new TypeError("internal detail /var/task/secret.ts:1");
      },
    }));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { default: handler } = await import("../src/index");
    const res = await handler(
      new Request("https://t/", {
        method: "POST",
        body: JSON.stringify({ before: baseSpec(), after: baseSpec() }),
      }),
    );
    const body = (await res.json()) as { error: { code: string } };
    expect(res.status).toBe(500);
    expect(body.error.code).toBe("ANALYSIS_FAILED");
    expect(JSON.stringify(body)).not.toMatch(/internal detail|secret\.ts|TypeError/);
  });

  it("rejects a declared Content-Length over the body limit before reading the body", async () => {
    const r = await post(
      { before: baseSpec(), after: baseSpec() },
      { headers: { "content-length": String(3 * 1024 * 1024) } },
    );
    expect(r.status).toBe(413);
  });

  it("every error response uses the documented error envelope", async () => {
    for (const body of ["{", { before: 1, after: 2 }, { before: { openapi: "3.1.0" }, after: baseSpec() }]) {
      const r = await post(body);
      expect(r.status).toBeGreaterThanOrEqual(400);
      expect(r.json.status).toBe("error");
      expect(Object.keys(r.json.error).sort()).toEqual(
        expect.arrayContaining(["code", "message", "retryable"]),
      );
    }
  });
});

describe("response size is bounded", () => {
  it("lists at most maxChanges, keeps full counts, and truncates large evidence", async () => {
    const { LIMITS } = await import("../src/core/limits");
    const before = baseSpec();
    const after = clone(before);
    const big = { type: "object", description: "x".repeat(1_200) };
    for (let i = 0; i < LIMITS.maxChanges + 50; i++) {
      after.paths[`/generated/${String(i).padStart(4, "0")}`] = {
        get: {
          responses: { "200": { description: "ok", content: { "application/json": { schema: big } } } },
        },
      };
    }
    const r = await post({ before, after });
    expect(r.status).toBe(200);
    expect(r.json.changes).toHaveLength(LIMITS.maxChanges);
    expect(r.json.summary.total_changes).toBe(LIMITS.maxChanges + 50);
    expect(r.json.metadata.changes_omitted).toBe(50);
    expect(r.json.limitations.join(" ")).toMatch(/most severe/);
    expect(r.json.changes[0].evidence.truncated).toBe(true);
    expect(JSON.stringify(r.json).length).toBeLessThan(2_000_000);
  });
});

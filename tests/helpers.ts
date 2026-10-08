import { type AnalysisResult, analyze } from "../src/analyze";
import type { Change } from "../src/core/classify";
import handler from "../src/index";

export type Spec = Record<string, any>;

/** Minimal valid OpenAPI 3.0.3 document with one operation. */
export function baseSpec(): Spec {
  return {
    openapi: "3.0.3",
    info: { title: "Test API", version: "1.0.0" },
    paths: {
      "/users": {
        get: {
          parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["id"],
                    properties: {
                      id: { type: "string" },
                      email: { type: "string", maxLength: 100 },
                      status: { type: "string", enum: ["active", "disabled"] },
                    },
                  },
                },
              },
            },
            "404": { description: "not found" },
          },
        },
        post: {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", maxLength: 50 },
                    age: { type: "integer", minimum: 0 },
                    role: { type: "string", enum: ["admin", "user"] },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "created" } },
        },
      },
    },
  };
}

export function clone<T>(v: T): T {
  return structuredClone(v);
}

export async function compare(before: Spec, after: Spec): Promise<AnalysisResult> {
  return analyze({ before, after });
}

/** Applies `mutate` to a copy of the base spec and returns the analysis. */
export async function diffAfter(
  mutate: (s: Spec) => void,
  start: Spec = baseSpec(),
): Promise<AnalysisResult> {
  const after = clone(start);
  mutate(after);
  return compare(start, after);
}

export function only(result: AnalysisResult, filter: (c: Change) => boolean = () => true) {
  return result.changes.filter(filter);
}

export async function post(body: unknown, init: RequestInit = {}): Promise<{ status: number; json: Spec }> {
  const res = await handler(
    new Request("https://test.local/", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      ...init,
    }),
  );
  return { status: res.status, json: (await res.json()) as Spec };
}

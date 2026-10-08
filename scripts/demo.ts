/**
 * Builds the real-world demo in demo/github-rest-api/ from GitHub's published REST API description
 * (@octokit/openapi, MIT): 22.0.0 (2025-12-09) → 24.0.0 (2026-10-05), a fixed set of paths plus the
 * components they reference. Writes before.json, after.json and response.json (duration_ms pinned to 0).
 *   bun run demo          # needs npm (downloads the two packages into .bench/ once)
 * tests/docs.test.ts checks that response.json still matches the engine output for the committed inputs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../src/analyze";

const root = fileURLToPath(new URL("..", import.meta.url));
export const DEMO_DIR = join(root, "demo/github-rest-api");
export const BEFORE_VERSION = "22.0.0";
export const AFTER_VERSION = "24.0.0";
export const DEMO_PATHS = [
  "/organizations/{org}/settings/billing/budgets/{budget_id}",
  "/orgs/{org}/copilot/metrics",
  "/orgs/{org}/teams/{team_slug}",
  "/repos/{owner}/{repo}/issues/{issue_number}/timeline",
  "/repos/{owner}/{repo}/tags/protection",
  "/teams/{team_id}/discussions",
];

type Spec = Record<string, any>;

/** Keeps DEMO_PATHS (those present) and only the components they transitively reference. */
export function pickPaths(spec: Spec, keys: string[]): Spec {
  const paths: Spec = {};
  for (const key of keys) if (spec.paths[key]) paths[key] = spec.paths[key];
  const keep = new Set<string>();
  const queue: unknown[] = [paths];
  while (queue.length > 0) {
    const node = queue.pop();
    if (Array.isArray(node)) queue.push(...node);
    else if (node && typeof node === "object") {
      const ref = (node as Spec).$ref;
      if (typeof ref === "string" && ref.startsWith("#/components/") && !keep.has(ref)) {
        keep.add(ref);
        const [, , type = "", name = ""] = ref.split("/");
        queue.push(spec.components?.[type]?.[name]);
      }
      queue.push(...Object.values(node));
    }
  }
  const components: Spec = {};
  for (const ref of [...keep].sort()) {
    const [, , type = "", name = ""] = ref.split("/");
    components[type] ??= {};
    components[type][name] = spec.components[type][name];
  }
  return { openapi: spec.openapi, info: spec.info, paths, components };
}

export async function demoResponse(before: Spec, after: Spec): Promise<unknown> {
  return analyze({ before, after }, () => 0);
}

if (import.meta.main) {
  const { loadGithubSpec } = await import("./lib/github-slice");
  const before = pickPaths(loadGithubSpec(BEFORE_VERSION), DEMO_PATHS);
  const after = pickPaths(loadGithubSpec(AFTER_VERSION), DEMO_PATHS);
  mkdirSync(DEMO_DIR, { recursive: true });
  const write = (name: string, value: unknown) =>
    writeFileSync(join(DEMO_DIR, name), `${JSON.stringify(value, null, 2)}\n`);
  write("before.json", before);
  write("after.json", after);
  write("response.json", await demoResponse(before, after));
  console.log(`wrote ${DEMO_DIR} (request body ${JSON.stringify({ before, after }).length} bytes)`);
}

/**
 * T-108 benchmark (manual; not run in CI). Measures analysis time, memory and expanded size on
 * slices of GitHub's real OpenAPI spec (two published versions) at increasing sizes, so LIMITS can be
 * calibrated against real-world documents.
 *
 *   bun scripts/bench.ts            # downloads @octokit/openapi v22.0.0 and v24.0.0 into .bench/ on first run
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { analyze } from "../src/analyze";
import { LIMITS } from "../src/core/limits";
import { expandedSize } from "../src/core/validate";

const root = join(import.meta.dir, "..");
const dir = join(root, ".bench");
mkdirSync(dir, { recursive: true });

function load(version: string): Record<string, any> {
  const file = join(dir, version, "package/generated/api.github.com.json");
  if (!existsSync(file)) {
    execSync(`npm pack @octokit/openapi@${version} --silent`, { cwd: dir });
    mkdirSync(join(dir, version), { recursive: true });
    execSync(`tar -xzf octokit-openapi-${version}.tgz -C ${version}`, { cwd: dir });
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Keeps the first `n` paths and only the components they (transitively) reference. */
function slice(spec: Record<string, any>, n: number): Record<string, any> {
  const paths: Record<string, any> = {};
  for (const key of Object.keys(spec.paths).sort().slice(0, n)) paths[key] = spec.paths[key];
  const keep = new Set<string>();
  const queue: any[] = [paths];
  while (queue.length) {
    const node = queue.pop();
    if (Array.isArray(node)) queue.push(...node);
    else if (node && typeof node === "object") {
      if (typeof node.$ref === "string" && node.$ref.startsWith("#/components/") && !keep.has(node.$ref)) {
        keep.add(node.$ref);
        const [, , type, name] = node.$ref.split("/");
        queue.push(spec.components?.[type]?.[name]);
      }
      queue.push(...Object.values(node));
    }
  }
  const components: Record<string, any> = {};
  for (const ref of keep) {
    const [, , type = "", name = ""] = ref.split("/");
    components[type] ??= {};
    components[type][name] = spec.components[type][name];
  }
  return { openapi: spec.openapi, info: spec.info, paths, components };
}

const before = load("22.0.0");
const after = load("24.0.0");
console.log(`maxExpandedNodes = ${LIMITS.maxExpandedNodes}`);
console.log("paths | before KB | after KB | expanded nodes (max of both) | ms | RSS MB | changes | result");
for (const n of [10, 40, 80, 120, 160, 200]) {
  const b = slice(before, n);
  const a = slice(after, n);
  const kb = (x: unknown) => Math.round(JSON.stringify(x).length / 1024);
  let expanded = "-";
  try {
    expanded = String(Math.max(expandedSize(b, "before"), expandedSize(a, "after")));
  } catch {
    expanded = `> ${LIMITS.maxExpandedNodes}`;
  }
  Bun.gc(true);
  const t = performance.now();
  let outcome: string;
  let changes = "-";
  try {
    const r = await analyze({ before: b, after: a });
    outcome = r.compatibility;
    changes = String(r.summary.total_changes);
  } catch (e: any) {
    outcome = e.code ?? e.name;
  }
  const ms = Math.round(performance.now() - t);
  console.log(
    `${n} | ${kb(b)} | ${kb(a)} | ${expanded} | ${ms} | ${Math.round(process.memoryUsage().rss / 1e6)} | ${changes} | ${outcome}`,
  );
}

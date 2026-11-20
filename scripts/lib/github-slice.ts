/** Real-world spec source for benchmarks and live verification: GitHub's OpenAPI spec via @octokit/openapi. */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../../.bench", import.meta.url));

/** Only plain semver versions reach the filesystem and the commands below (no shell is used either). */
export function checkVersion(version: string): string {
  if (!/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version)) throw new Error("version must look like 22.0.0");
  return version;
}

export function loadGithubSpec(version: string): Record<string, any> {
  checkVersion(version);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, version, "package/generated/api.github.com.json");
  if (!existsSync(file)) {
    // npm verifies the tarball against the registry's integrity hash; arguments are passed without a shell.
    execFileSync("npm", ["pack", `@octokit/openapi@${version}`, "--silent"], { cwd: dir });
    mkdirSync(join(dir, version), { recursive: true });
    execFileSync("tar", ["-xzf", `octokit-openapi-${version}.tgz`, "-C", version], { cwd: dir });
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Keeps the first `n` paths and only the components they (transitively) reference. */
export function slice(spec: Record<string, any>, n: number): Record<string, any> {
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

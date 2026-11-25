/**
 * examples/github-actions/breakra.yml must work as written: run its shell step in a temporary git repository
 * (base branch + pull-request branch), with `npx -y breakra@<version>` swapped for this repo's CLI.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const pkg = JSON.parse(read("package.json"));
const source = read("examples/github-actions/breakra.yml");
const workflow = parse(source);
const job = workflow.jobs.breakra;
const step = job.steps.find((s: { run?: string }) => s.run);
const NPX = `npx -y breakra@${pkg.version}`;

const spec = (paths: Record<string, unknown>) =>
  `openapi: 3.0.3\ninfo: {title: shop, version: "1"}\npaths: ${JSON.stringify(paths)}\n`;
const ok = { responses: { "200": { description: "ok" } } };
const BASE = spec({ "/orders": { get: ok, post: ok } });

function runStep(after: string | null, env: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), "breakra-gha-"));
  const git = (...args: string[]) => {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  };
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  writeFileSync(join(dir, "README.md"), "x\n");
  if (after !== null) writeFileSync(join(dir, "openapi.yaml"), BASE);
  git("add", ".");
  git("commit", "-qm", "base");
  git("update-ref", "refs/remotes/origin/main", "main"); // what actions/checkout with fetch-depth 0 provides
  git("checkout", "-qb", "pr");
  writeFileSync(join(dir, "openapi.yaml"), after ?? BASE);
  const script = step.run.replace(NPX, `"${process.execPath}" "${join(root, "src/cli.ts")}"`);
  const r = spawnSync("bash", ["-e", "-c", script], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, ...job.env, ...env, BASE: "main", RUNNER_TEMP: dir },
  });
  return { code: r.status, out: r.stdout + r.stderr };
}

describe("examples/github-actions/breakra.yml", () => {
  it("is a valid workflow pinned to the current package version, with read-only permissions", () => {
    expect(step.run).toContain(NPX);
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.on.pull_request.paths).toEqual([job.env.SPEC]);
    expect(step.env.BASE).toBe("${{ github.base_ref }}"); // untrusted context goes through env, not the script
    expect(step.run).not.toContain("${{");
  });

  it("fails the pull request on a breaking change (exit 1)", () => {
    const r = runStep(spec({ "/orders": { get: ok } }));
    expect(r.code, r.out).toBe(1);
    expect(r.out).toContain("verdict: block");
    expect(r.out).toContain("POST /orders was removed");
  });

  it("passes a compatible change (exit 0)", () => {
    const r = runStep(spec({ "/orders": { get: ok, post: ok }, "/customers": { get: ok } }));
    expect(r.code, r.out).toBe(0);
    expect(r.out).toContain("verdict: safe");
  });

  it("skips when the contract is new on the branch", () => {
    const r = runStep(null);
    expect(r.code, r.out).toBe(0);
    expect(r.out).toContain("is new on this branch");
  });

  it("FAIL_ON: review also fails on potentially breaking changes", () => {
    const narrowed = spec({
      "/orders": {
        get: {
          ...ok,
          parameters: [{ name: "customer_id", in: "query", required: true, schema: { type: "string" } }],
        },
        post: ok,
      },
    });
    expect(runStep(narrowed).code).toBe(0); // block: review-level findings pass
    const r = runStep(narrowed, { FAIL_ON: "review" });
    expect(r.code, r.out).toBe(1);
    expect(r.out).toContain("verdict: review");
  });

  it("an unreadable contract is an error (exit 2), never a pass", () => {
    const r = runStep("openapi: [");
    expect(r.code, r.out).toBe(2);
  });
});

describe("the workflow on breakra.dev/integrations", () => {
  it("is exactly examples/github-actions/breakra.yml", () => {
    const page = read("site/integrations.html");
    const escaped = source.trimEnd().replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    expect(page).toContain(`<pre><code>${escaped}</code></pre>`);
  });
});

describe("the official action (D-047)", () => {
  const ACTION = "danbuildss/breakra-action@v1.0.0";
  const example = parse(read("examples/github-actions/breakra-action.yml"));
  const self = parse(read(".github/workflows/contract-check.yml"));
  const actionStep = (wf: any) =>
    wf.jobs.breakra.steps.find((s: { uses?: string }) => s.uses?.includes("breakra-action"));

  it("the example and Breakra's own check use the same pinned release", () => {
    expect(actionStep(example).uses).toBe(ACTION);
    expect(actionStep(self).uses).toBe(ACTION);
    expect(actionStep(self).with).toEqual({ spec: "openapi.json", "fail-on": "block" });
  });

  it("the example asks only for what the action needs, and watches the file it checks", () => {
    expect(example.permissions).toEqual({ contents: "read", "pull-requests": "write" });
    expect(example.on.pull_request.paths).toEqual([actionStep(example).with.spec]);
    expect(Object.keys(example.on)).toEqual(["pull_request"]); // never pull_request_target
  });

  it("breakra.dev shows the same pinned release", () => {
    for (const page of ["site/index.html", "site/integrations.html"]) expect(read(page)).toContain(ACTION);
  });
});

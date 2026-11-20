/**
 * Proves the npm package works for a stranger (D-041): `npm pack`, install the tarball into an empty folder
 * outside the repo, then run it with plain Node: --version, JSON and YAML checks, exit codes, a YAML alias
 * bomb, and a full MCP stdio session whose stdout carries only JSON-RPC.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const fail = (msg: string): never => {
  console.error(`NPM SMOKE FAIL: ${msg}`);
  process.exit(1);
};
const run = (cmd: string, args: string[], cwd: string, input?: string) => {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", input });
  return { code: r.status ?? -1, out: r.stdout ?? "", err: r.stderr ?? "" };
};

// 1. Pack (runs `prepack` = build:npm) and check exactly what would be published.
const work = mkdtempSync(join(tmpdir(), "breakra-npm-"));
const packed = run("npm", ["pack", "--json", "--pack-destination", work], root);
if (packed.code !== 0) fail(`npm pack: ${packed.err}`);
// `prepack` (the build) prints to stdout too; the JSON report starts at the first line that opens an array.
const info = JSON.parse(packed.out.slice(packed.out.search(/^\[/m)))[0];
const files = info.files.map((f: { path: string }) => f.path).sort();
const expected = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "dist/npm/THIRD_PARTY_NOTICES.md",
  "dist/npm/cli.js",
  "package.json",
].sort();
if (JSON.stringify(files) !== JSON.stringify(expected)) fail(`unexpected package files: ${files.join(", ")}`);
if (info.name !== "breakra" || info.version !== pkg.version)
  fail(`name/version: ${info.name}@${info.version}`);

// 2. Install the tarball into an empty project outside the repo (zero runtime dependencies: offline-safe).
const app = join(work, "app");
run("mkdir", ["-p", app], work);
writeFileSync(join(app, "package.json"), '{ "name": "smoke-app", "private": true }\n');
const inst = run("npm", ["install", "--no-audit", "--no-fund", "--offline", join(work, info.filename)], app);
if (inst.code !== 0) fail(`npm install: ${inst.err}`);
const bin = join(app, "node_modules/.bin/breakra");
const node = (args: string[], input?: string) => run("node", [bin, ...args], app, input);

// 3. CLI on plain Node.
const v = node(["--version"]);
if (v.code !== 0 || !v.out.includes(`breakra ${pkg.version} (engine `)) fail(`--version: ${v.out}${v.err}`);
const req = JSON.parse(readFileSync(join(root, "examples/request.json"), "utf8"));
writeFileSync(join(app, "before.json"), JSON.stringify(req.before));
writeFileSync(join(app, "after.yaml"), `# YAML\n${JSON.stringify(req.after)}\n`);
writeFileSync(
  join(app, "plain.yaml"),
  "openapi: 3.1.0\ninfo:\n  title: t\n  version: '1'\npaths:\n  /a:\n    get:\n      responses:\n        '200': { description: ok }\n",
);
const block = node(["check", "before.json", "after.yaml", "--json"]);
if (block.code !== 1) fail(`block should exit 1, got ${block.code}: ${block.err}`);
const result = JSON.parse(block.out);
if (result.verdict !== "block" || !String(result.analysis_id).startsWith("sha256:"))
  fail("unexpected result");
// Parity: Node + yaml must give exactly the result Bun (the hosted runtime) gives for the same documents.
const { analyze } = await import("../src/analyze");
const hosted = await analyze({ before: req.before, after: req.after });
if (result.analysis_id !== hosted.analysis_id) fail("Node result differs from the Bun/hosted engine");
const safe = node(["check", "plain.yaml", "plain.yaml"]);
if (safe.code !== 0 || !safe.out.startsWith("verdict: safe"))
  fail(`real YAML, same file: ${safe.code} ${safe.out}`);
const levels = ["a: &a [x, x, x, x, x, x, x, x, x, x]"];
for (let i = 1; i < 9; i++) {
  const p = String.fromCharCode(96 + i);
  levels.push(
    `${String.fromCharCode(97 + i)}: &${String.fromCharCode(97 + i)} [${Array(10).fill(`*${p}`).join(", ")}]`,
  );
}
writeFileSync(
  join(app, "bomb.yaml"),
  `openapi: 3.0.3\ninfo: {title: t, version: "1"}\npaths: {}\nx:\n  ${levels.join("\n  ")}\n`,
);
const bomb = node(["check", "bomb.yaml", "plain.yaml"]);
if (bomb.code !== 2) fail(`alias bomb should be a clean error (exit 2), got ${bomb.code}`);
const missing = node(["check", "nope.yaml", "plain.yaml"]);
if (missing.code !== 2) fail(`missing file should exit 2, got ${missing.code}`);

// 4. MCP over stdio on plain Node: only JSON-RPC on stdout.
const child = spawn("node", [bin, "mcp"], { cwd: app, stdio: ["pipe", "pipe", "pipe"] });
let stdout = "";
child.stdout.on("data", (d) => {
  stdout += d.toString();
});
const send = (m: object) => child.stdin.write(`${JSON.stringify(m)}\n`);
send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
send({
  jsonrpc: "2.0",
  id: 3,
  method: "tools/call",
  params: {
    name: "check_openapi_change",
    arguments: { before: req.before, after: readFileSync(join(app, "after.yaml"), "utf8") },
  },
});
send({
  jsonrpc: "2.0",
  id: 4,
  method: "tools/call",
  params: { name: "check_openapi_change", arguments: { before: "a: [", after: "b" } },
});
const deadline = Date.now() + 20_000;
while (stdout.split("\n").filter(Boolean).length < 4 && Date.now() < deadline)
  await new Promise((r) => setTimeout(r, 50));
child.kill();
const lines = stdout.split("\n").filter(Boolean);
const msgs = lines.map((l) => {
  try {
    return JSON.parse(l);
  } catch {
    return fail(`non-JSON on MCP stdout: ${l.slice(0, 120)}`);
  }
});
const byId = Object.fromEntries(msgs.map((m) => [m.id, m]));
if (byId[1]?.result?.serverInfo?.name !== "breakra") fail("MCP initialize");
if (byId[2]?.result?.tools?.[0]?.name !== "check_openapi_change") fail("MCP tools/list");
if (byId[3]?.result?.structuredContent?.analysis_id !== result.analysis_id)
  fail("MCP tools/call result differs from CLI");
if (byId[4]?.result?.isError !== true) fail("MCP bad input must be isError");

// 5. A client that disconnects early must not crash the server (EPIPE): it exits quietly.
const early = spawn("node", [bin, "mcp"], { cwd: app, stdio: ["pipe", "pipe", "pipe"] });
let earlyErr = "";
early.stderr.on("data", (d) => {
  earlyErr += d.toString();
});
early.stdout.destroy();
early.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })}\n`);
early.stdin.end();
const earlyCode = await new Promise<number | null>((r) => early.on("exit", (code) => r(code)));
if (earlyCode !== 0 || /EPIPE|Error/.test(earlyErr))
  fail(`disconnect: exit ${earlyCode} ${earlyErr.slice(0, 200)}`);

console.log(
  `npm smoke OK: ${info.filename} (${info.size} bytes packed, ${files.length} files), Node ${process.versions.node ? spawnSync("node", ["--version"], { encoding: "utf8" }).stdout.trim() : "?"}, CLI + MCP verified`,
);

/** Free local mode (D-039): CLI and MCP server run the same engine as the hosted API. */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyze } from "../src/analyze";
import { runCli } from "../src/cli";
import { handleMessage, TOOL } from "../src/mcp";

const root = join(__dirname, "..");
const request = JSON.parse(readFileSync(join(root, "examples/request.json"), "utf8"));
const dir = mkdtempSync(join(tmpdir(), "breakra-"));
const beforeFile = join(dir, "before.json");
const afterFile = join(dir, "after.yaml");
writeFileSync(beforeFile, JSON.stringify(request.before));
// The "after" document as YAML (JSON is valid YAML 1.2 flow syntax; the parser takes the YAML path).
writeFileSync(afterFile, `# after\n${JSON.stringify(request.after)}\n`);

const run = async (...args: string[]) => {
  const out: string[] = [];
  const err: string[] = [];
  const code = await runCli(
    args,
    (s) => out.push(s),
    (s) => err.push(s),
  );
  return { code, out: out.join("\n"), err: err.join("\n") };
};

describe("CLI: breakra check", () => {
  it("gives the hosted API's exact result for the same inputs (--json)", async () => {
    const r = await run("check", beforeFile, afterFile, "--json");
    const local = JSON.parse(r.out);
    const hosted = await analyze(request);
    expect({ ...local, metadata: { ...local.metadata, duration_ms: 0 } }).toEqual({
      ...hosted,
      metadata: { ...hosted.metadata, duration_ms: 0 },
    });
    expect(r.code).toBe(1); // verdict block, default --fail-on block
  });

  it("prints the verdict first and a fix for each finding that matters", async () => {
    const r = await run("check", beforeFile, afterFile);
    expect(r.out.split("\n")[0]).toMatch(/^verdict: block/);
    expect(r.out).toContain("→ Update callers of GET /orders to send `customer_id`.");
  });

  it("--use narrows the verdict to the operations you call", async () => {
    const r = await run("check", beforeFile, afterFile, "--use", "POST /orders");
    expect(r.out).toMatch(/for the 1 operation\(s\) you use: (safe|review)/);
    expect(r.code).toBe(0);
    const strict = await run("check", beforeFile, afterFile, "--use", "GET /orders", "--fail-on", "review");
    expect(strict.code).toBe(1);
  });

  it("exits 2 with a clear message on bad input, without echoing file content", async () => {
    const bad = join(dir, "bad.yaml");
    writeFileSync(bad, "SECRET_CONTENT: [unclosed");
    for (const args of [
      ["check", beforeFile],
      ["check", beforeFile, bad],
      ["check", beforeFile, join(dir, "nope")],
      ["nope"],
    ]) {
      const r = await run(...args);
      expect(r.code).toBe(2);
      expect(r.err).not.toContain("SECRET_CONTENT");
    }
  });
});

describe("MCP server", () => {
  it("negotiates the protocol and lists one read-only tool", async () => {
    const init = (await handleMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    })) as any;
    expect(init.result.protocolVersion).toBe("2025-06-18");
    expect(init.result.capabilities).toEqual({ tools: {} });
    expect(await handleMessage({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeNull();
    const list = (await handleMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" })) as any;
    expect(list.result.tools).toEqual([TOOL]);
    expect(TOOL.annotations.readOnlyHint).toBe(true);
  });

  it("tools/call returns the structured result and a readable summary", async () => {
    const res = (await handleMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: TOOL.name, arguments: { ...request, uses: [{ method: "GET", path: "/orders" }] } },
    })) as any;
    expect(res.result.isError).toBe(false);
    expect(res.result.structuredContent.verdict).toBe("block");
    expect(res.result.structuredContent.impact.uses).toBe(1);
    expect(res.result.content[0].text).toMatch(/^verdict: block/);
  });

  it("reports bad input as a tool error and unknown methods as JSON-RPC errors", async () => {
    const bad = (await handleMessage({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: TOOL.name, arguments: { before: "not: [valid", after: request.after } },
    })) as any;
    expect(bad.result.isError).toBe(true);
    expect(bad.result.content[0].text).toMatch(/^INVALID_REQUEST/);
    const unknown = (await handleMessage({ jsonrpc: "2.0", id: 5, method: "resources/list" })) as any;
    expect(unknown.error.code).toBe(-32601);
    const tool = (await handleMessage({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: { name: "x" },
    })) as any;
    expect(tool.error.code).toBe(-32602);
  });

  it("speaks newline-delimited JSON-RPC over stdio (`breakra mcp`)", async () => {
    const child = spawn("bun", [join(root, "src/cli.ts"), "mcp"], { stdio: ["pipe", "pipe", "pipe"] });
    const lines: any[] = [];
    let buf = "";
    child.stdout.on("data", (d) => {
      buf += d.toString();
      let nl = buf.indexOf("\n");
      while (nl >= 0) {
        lines.push(JSON.parse(buf.slice(0, nl)));
        buf = buf.slice(nl + 1);
        nl = buf.indexOf("\n");
      }
    });
    const send = (m: object) => child.stdin.write(`${JSON.stringify(m)}\n`);
    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25" } });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    send({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: TOOL.name, arguments: request } });
    const deadline = Date.now() + 15_000;
    while (lines.length < 2 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
    child.kill();
    expect(lines.map((l) => l.id)).toEqual([1, 2]);
    expect(lines[1].result.structuredContent.analysis_id).toBe((await analyze(request)).analysis_id);
  });
});

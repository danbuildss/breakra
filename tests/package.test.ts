/** npm packaging (D-041): versions, the Node YAML parser and the CLI's --version. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { setYamlParser } from "../src/core/validate";
import { parseYamlForNode } from "../src/node-yaml";
import { runCli, VERSION_TEXT } from "../src/run-cli";
import { ENGINE_VERSION, PACKAGE_VERSION, RULE_SET_VERSION } from "../src/version";

const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));

describe("package metadata", () => {
  it("PACKAGE_VERSION matches package.json; the engine version is separate", () => {
    expect(pkg.version).toBe(PACKAGE_VERSION);
    expect(VERSION_TEXT).toBe(
      `breakra ${PACKAGE_VERSION} (engine ${ENGINE_VERSION}, rule set ${RULE_SET_VERSION})`,
    );
  });
  it("is publishable, dependency-free, and registry-ready", () => {
    expect(pkg.private).toBeUndefined();
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(pkg.bin).toEqual({ breakra: "dist/npm/cli.js" });
    expect(pkg.mcpName).toBe("io.github.danbuildss/breakra");
    expect(pkg.engines.node).toBe(">=20");
    expect(pkg.repository.url).toContain("github.com/danbuildss/breakra");
  });
  it("--version prints the versions", async () => {
    const out: string[] = [];
    expect(await runCli(["--version"], (s) => out.push(s))).toBe(0);
    expect(out).toEqual([VERSION_TEXT]);
  });
});

describe("Node YAML parser (used when Bun.YAML is missing)", () => {
  it("parses OpenAPI YAML the same way as Bun's parser", () => {
    const text =
      "openapi: 3.1.0\ninfo: {title: t, version: '1'}\npaths:\n  /a: {get: {responses: {'200': {description: ok}}}}\n";
    expect(parseYamlForNode(text)).toEqual((globalThis as any).Bun.YAML.parse(text));
  });
  it("refuses alias bombs, duplicate keys and custom tags", () => {
    const levels = ["a: &a [x, x, x, x, x, x, x, x, x, x]"];
    for (let i = 1; i < 9; i++) {
      const p = String.fromCharCode(96 + i);
      levels.push(
        `${String.fromCharCode(97 + i)}: &${String.fromCharCode(97 + i)} [${Array(10).fill(`*${p}`).join(", ")}]`,
      );
    }
    expect(() => parseYamlForNode(levels.join("\n"))).toThrow();
    expect(() => parseYamlForNode("a: 1\na: 2\n")).toThrow();
    expect(parseYamlForNode("a: !!js/function 'x'")).not.toHaveProperty("a.call");
  });
  it("can be registered as the fallback parser", () => {
    setYamlParser(parseYamlForNode);
    setYamlParser(null);
  });
});

describe("MCP Registry metadata (server.json, PR C)", () => {
  const server = JSON.parse(readFileSync(join(__dirname, "../server.json"), "utf8"));
  it("matches the npm package: name = mcpName, versions = package version, runs `npx breakra mcp`", () => {
    expect(server.name).toBe(pkg.mcpName);
    expect(server.version).toBe(pkg.version);
    expect(server.description.length).toBeLessThanOrEqual(100);
    expect(server.repository).toEqual({ url: "https://github.com/danbuildss/breakra", source: "github" });
    expect(server.packages).toEqual([
      {
        registryType: "npm",
        identifier: pkg.name,
        version: pkg.version,
        runtimeHint: "npx",
        transport: { type: "stdio" },
        packageArguments: [{ type: "positional", value: "mcp" }],
      },
    ]);
  });
  it("the MCP server reports the package version", async () => {
    const { handleMessage } = await import("../src/mcp");
    const init = (await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })) as any;
    expect(init.result.serverInfo.version).toBe(PACKAGE_VERSION);
  });
});

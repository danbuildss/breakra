/** Review action #4: every local error says what went wrong, where, and what to do next, without echoing contract content. */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli";
import { locateSyntaxError } from "../src/hints";
import { handleMessage, TOOL } from "../src/mcp";

const root = join(__dirname, "..");
const dir = mkdtempSync(join(tmpdir(), "breakra-errors-"));
const file = (name: string, text: string) => {
  const p = join(dir, name);
  writeFileSync(p, text);
  return p;
};
const good = join(root, "integrations/fixtures/breaking/before.yaml");
// The secret marker must never appear in any error: messages carry positions, not content.
const SECRET = "sk_live_DO_NOT_ECHO";
const badYaml = file(
  "bad.yaml",
  `openapi: 3.0.3\ninfo:\n  title: ${SECRET}\n  version: "1"\npaths:\n  /a: [\n`,
);
const badJson = file(
  "bad.json",
  `{\n "openapi": "3.0.3",\n "info": {"title":"${SECRET}","version":"1"},\n "paths": ]\n}`,
);
const swagger = file(
  "swagger.json",
  JSON.stringify({ swagger: "2.0", info: { title: "x", version: "1" }, paths: {} }),
);
const invalid = file(
  "invalid.yaml",
  'openapi: 3.0.3\ninfo:\n  title: x\n  version: "1"\npaths:\n  orders:\n    get: {}\n',
);
const folder = join(dir, "folder");
mkdirSync(folder);

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

describe("CLI errors: what, where, next step (exit 2 = unchecked)", () => {
  const cases: Array<[string, string[], RegExp, RegExp]> = [
    [
      "missing file",
      ["check", join(dir, "nope.yaml"), good],
      /Cannot read the "before" file .*nope\.yaml: no such file\./,
      /Check the path/,
    ],
    ["a folder", ["check", folder, good], /: it is a folder\./, /contract file inside that folder/],
    [
      "broken YAML",
      ["check", good, badYaml],
      /"after" \(.*bad\.yaml\) is not valid YAML at line \d+, column \d+\./,
      /Fix the syntax/,
    ],
    [
      "broken JSON",
      ["check", good, badJson],
      /"after" \(.*bad\.json\) is not valid JSON at line 4, column 11\./,
      /Fix the syntax/,
    ],
    ["Swagger 2.0", ["check", swagger, good], /Swagger 2\.0/, /Convert it to OpenAPI 3 first/],
    [
      "invalid OpenAPI, with its location",
      ["check", invalid, good],
      /must start with "\/"\. \(at \/paths\/orders\)/,
      /Fix the document at that location/,
    ],
    ["wrong number of files", ["check", good], /Give exactly two files/, /breakra --help/],
    ["unknown flag", ["check", good, good, "--bogus"], /Unknown option --bogus/, /breakra --help/],
    [
      "bad --use",
      ["check", good, good, "--use", "GET"],
      /--use "GET" is not METHOD and path/,
      /--use "GET \/orders\/\{id\}"/,
    ],
  ];
  for (const [name, args, message, hint] of cases) {
    it(name, async () => {
      const r = await run(...args);
      expect(r.code).toBe(2);
      expect(r.out).toBe("");
      const [first, second] = r.err.split("\n");
      expect(first).toMatch(message);
      expect(second).toMatch(/^→ /);
      expect(second).toMatch(hint);
      expect(r.err).not.toContain(SECRET);
    });
  }

  it("--json prints the hosted API's error body plus a hint on stdout, wherever --json appears", async () => {
    for (const args of [
      ["check", "--json", good, badYaml],
      ["check", "--bogus", "--json", good, good],
    ]) {
      const r = await run(...args);
      expect(r.code).toBe(2);
      expect(r.err).toBe("");
      const body = JSON.parse(r.out);
      expect(body.status).toBe("error");
      expect(body.error.code).toBe("INVALID_REQUEST");
      expect(typeof body.error.hint).toBe("string");
      expect(body.error.retryable).toBe(false);
      expect(r.out).not.toContain(SECRET);
    }
    const syntax = JSON.parse((await run("check", "--json", good, badJson)).out);
    expect(syntax.error.details).toMatchObject({ side: "after", reason: "syntax", line: 4, column: 11 });
  });
});

describe("syntax locations", () => {
  it("finds the line and column of a JSON or YAML error, and nothing in valid text", () => {
    expect(locateSyntaxError('{\n "a": 1,\n "b": ]\n}')).toEqual({ line: 3, column: 7 });
    expect(locateSyntaxError("a: 1\nb: [\n")).toMatchObject({ line: expect.any(Number) });
    expect(locateSyntaxError(readFileSync(good, "utf8"))).toBeUndefined();
  });
});

describe("MCP errors carry the next step too", () => {
  it("a broken inline YAML document reports its line and a hint, and never its content", async () => {
    const res = (await handleMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: TOOL.name,
        arguments: { before: readFileSync(badYaml, "utf8"), after: readFileSync(good, "utf8") },
      },
    })) as any;
    expect(res.result.isError).toBe(true);
    const text: string = res.result.content[0].text;
    expect(text).toMatch(/^INVALID_REQUEST: "before" is not valid YAML at line \d+, column \d+\./);
    expect(text).toMatch(/\n→ Fix the syntax/);
    expect(text).not.toContain(SECRET);
  });
});

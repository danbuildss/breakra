/**
 * The `breakra` command (D-039, D-041), shared by the Bun entry (src/cli.ts) and the npm entry (src/bin.ts).
 *
 *   breakra check before.yaml after.yaml [--use "GET /orders/{id}"]... [--json] [--fail-on block|review]
 *   breakra mcp      # MCP server over stdio (tool: check_openapi_change)
 *   breakra --version
 *
 * Exit codes for `check`: 0 = below the --fail-on level (default: block), 1 = at or above it, 2 = error.
 * Callers must treat 2 as "unchecked", never as safe.
 */
import { BreakraError } from "./core/errors";
import type { UsedOperation } from "./core/verdict";
import { analyzeLocal, formatText, parseUseFlag, readSpecFile } from "./local";
import { serveStdio } from "./mcp";
import { ENGINE_VERSION, PACKAGE_VERSION, RULE_SET_VERSION } from "./version";

export const VERSION_TEXT = `breakra ${PACKAGE_VERSION} (engine ${ENGINE_VERSION}, rule set ${RULE_SET_VERSION})`;

const USAGE = `breakra ${PACKAGE_VERSION}: OpenAPI breaking-change checks for agents (free, local)

  breakra check <before> <after> [--use "METHOD /path"]... [--json] [--fail-on block|review]
  breakra mcp
  breakra --version

<before>/<after>: OpenAPI 3.0.x or 3.1.x files, JSON or YAML.
--use       an operation your code calls; repeat it. Filters findings to those operations.
--json      print the full result as JSON (same shape as the hosted API).
--fail-on   exit 1 when the verdict reaches this level (default: block).
Hosted API (pay per call, no install): https://breakra.dev/skill.md`;

const RANK = { safe: 0, review: 1, block: 2 } as const;

export async function runCli(argv: string[], out = console.log, err = console.error): Promise<number> {
  const [command, ...rest] = argv;
  if (command === "--version" || command === "-v") {
    out(VERSION_TEXT);
    return 0;
  }
  if (command === "mcp") {
    await serveStdio();
    return 0;
  }
  if (command !== "check") {
    (command === "--help" || command === "-h" || command === undefined ? out : err)(USAGE);
    return command === "--help" || command === "-h" ? 0 : 2;
  }
  const files: string[] = [];
  const uses: UsedOperation[] = [];
  let json = false;
  let failOn: keyof typeof RANK = "block";
  try {
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i] as string;
      if (a === "--json") json = true;
      else if (a === "--use") uses.push(parseUseFlag(rest[++i] ?? ""));
      else if (a === "--fail-on") {
        const v = rest[++i];
        if (v !== "block" && v !== "review")
          throw new BreakraError("INVALID_REQUEST", "--fail-on must be block or review.");
        failOn = v;
      } else if (a.startsWith("--"))
        throw new BreakraError("INVALID_REQUEST", `Unknown option ${a.slice(0, 40)}.`);
      else files.push(a);
    }
    if (files.length !== 2)
      throw new BreakraError("INVALID_REQUEST", "Give exactly two files: <before> <after>.");
    const result = await analyzeLocal(
      readSpecFile(files[0] as string, "before"),
      readSpecFile(files[1] as string, "after"),
      uses.length ? uses : undefined,
    );
    out(json ? JSON.stringify(result, null, 2) : formatText(result));
    const verdict = result.impact ? result.impact.verdict : result.verdict;
    return RANK[verdict] >= RANK[failOn] ? 1 : 0;
  } catch (e) {
    err(
      e instanceof BreakraError
        ? `${e.code}: ${e.message}`
        : "ANALYSIS_FAILED: the analysis failed unexpectedly.",
    );
    return 2;
  }
}

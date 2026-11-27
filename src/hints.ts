/**
 * Local-tool error help (CLI, MCP): where a syntax error is, and what to do next for every error code.
 * Never echoes contract content: only line/column numbers, file names the caller gave, and JSON pointers.
 * Not imported by the hosted handler (src/index.ts), so the `yaml` library stays out of the Bankr bundle.
 */
import { LineCounter, parseDocument } from "yaml";
import { BreakraError, errorBody } from "./core/errors";
import { type JsonObject, parseSpecText } from "./core/validate";

/** 1-based line and column of the first syntax error in JSON or YAML text, when the parser can tell. */
export function locateSyntaxError(text: string): { line: number; column: number } | undefined {
  try {
    const lineCounter = new LineCounter();
    const doc = parseDocument(text, { lineCounter, uniqueKeys: true, prettyErrors: false });
    const first = doc.errors[0];
    if (!first) return undefined;
    const { line, col } = lineCounter.linePos(first.pos[0]);
    return { line, column: col };
  } catch {
    return undefined;
  }
}

/** A file name safe to print: no control characters, bounded length. */
export function safeLabel(name: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
  const clean = name.replace(/[\u0000-\u001f\u007f]/g, "?");
  return clean.length > 200 ? `…${clean.slice(-199)}` : clean;
}

/**
 * parseSpecText with a location: a syntax error says "at line L, column C" (and names the file, when given).
 */
export function parseWithLocation(text: string, side: "before" | "after", label?: string): JsonObject {
  try {
    return parseSpecText(text, side);
  } catch (err) {
    if (!(err instanceof BreakraError) || err.code !== "INVALID_REQUEST") throw err;
    const kind = /^\s*\{/.test(text) ? "JSON" : "YAML";
    const where = locateSyntaxError(text);
    const name = label ? ` (${label})` : "";
    if (!where) {
      if (/not valid (JSON|YAML)/.test(err.message)) {
        throw new BreakraError("INVALID_REQUEST", `"${side}"${name} is not valid ${kind}.`, {
          side,
          reason: "syntax",
          ...(label ? { path: label } : {}),
        });
      }
      throw new BreakraError(
        "INVALID_REQUEST",
        `"${side}"${name} is not an OpenAPI document (a JSON or YAML object).`,
        {
          side,
          reason: "not_object",
          ...(label ? { path: label } : {}),
        },
      );
    }
    throw new BreakraError(
      "INVALID_REQUEST",
      `"${side}"${name} is not valid ${kind} at line ${where.line}, column ${where.column}.`,
      { side, reason: "syntax", line: where.line, column: where.column, ...(label ? { path: label } : {}) },
    );
  }
}

/** The next step for an error, written for a person or an agent. */
export function hintFor(e: BreakraError): string | undefined {
  const reason = e.details?.reason;
  switch (e.code) {
    case "INVALID_REQUEST":
      if (reason === "not_found") return "Check the path, or run from the folder that contains the file.";
      if (reason === "is_directory") return "Give the path to the contract file inside that folder.";
      if (reason === "permission_denied")
        return "Make the file readable (you need read access), then run again.";
      if (reason === "syntax") return "Fix the syntax at that position and run again.";
      if (reason === "not_object")
        return 'Give an OpenAPI 3.0/3.1 document: a JSON or YAML object with an "openapi" field.';
      if (reason === "usage") return "Run breakra --help for usage.";
      if (reason === "use") return 'Write each --use as METHOD and path, e.g. --use "GET /orders/{id}".';
      return undefined;
    case "INVALID_SPECIFICATION":
      return "Fix the document at that location; it must be a valid OpenAPI 3.0/3.1 document.";
    case "UNSUPPORTED_OPENAPI_VERSION":
      return /Swagger 2\.0/.test(e.message)
        ? "Convert it to OpenAPI 3 first, then compare."
        : "Breakra supports OpenAPI 3.0.0–3.0.4 and 3.1.0–3.1.1.";
    case "PAYLOAD_TOO_LARGE":
    case "SPEC_TOO_COMPLEX":
      return /Compare only the paths you use/.test(e.message)
        ? undefined
        : "Compare only the paths you use: extract them, with the components they reference, into smaller files.";
    case "ANALYSIS_FAILED":
      return "This is a Breakra bug. Please report it at https://github.com/danbuildss/breakra/issues with the command you ran (not your contract).";
    default:
      return undefined;
  }
}

/** Human lines: "CODE: message (at /pointer)" then "→ next step". */
export function describeError(e: BreakraError): string {
  const at = typeof e.details?.pointer === "string" ? ` (at ${e.details.pointer})` : "";
  const hint = hintFor(e);
  return `${e.code}: ${e.message}${at}${hint ? `\n→ ${hint}` : ""}`;
}

/** The hosted API's error body, plus the hint: what `breakra check --json` prints on failure. */
export function errorJson(e: BreakraError): string {
  const body = errorBody(e);
  const hint = hintFor(e);
  return JSON.stringify({ ...body, error: { ...body.error, ...(hint ? { hint } : {}) } }, null, 2);
}

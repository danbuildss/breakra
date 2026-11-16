/**
 * Free local mode (D-039): the same engine as the hosted API, run on your own machine with no wallet and no
 * network access. Shared by the CLI and the MCP server.
 */
import { readFileSync, statSync } from "node:fs";
import { type AnalysisResult, analyze } from "./analyze";
import { BreakraError } from "./core/errors";
import { LIMITS } from "./core/limits";
import { type JsonObject, parseSpecText } from "./core/validate";
import { parseUses, type UsedOperation } from "./core/verdict";

/** Reads a local OpenAPI file (JSON or YAML). Same size limit as the hosted API, per document. */
export function readSpecFile(path: string, side: "before" | "after"): JsonObject {
  let size: number;
  try {
    size = statSync(path).size;
  } catch {
    throw new BreakraError("INVALID_REQUEST", `Cannot read the "${side}" file.`, { side });
  }
  if (size > LIMITS.maxBodyBytes) {
    throw new BreakraError("PAYLOAD_TOO_LARGE", `The "${side}" file exceeds 1 MB.`, { side });
  }
  return parseSpecText(readFileSync(path, "utf8"), side);
}

/** "GET /orders/{id}" → { method, path }. */
export function parseUseFlag(text: string): UsedOperation {
  const [method, path, ...rest] = text.trim().split(/\s+/);
  return parseUses([{ method, path: rest.length ? `${path} ${rest.join(" ")}` : path }])[0] as UsedOperation;
}

export async function analyzeLocal(
  before: JsonObject,
  after: JsonObject,
  uses?: unknown,
): Promise<AnalysisResult> {
  return analyze({ before, after, ...(uses === undefined ? {} : { uses: parseUses(uses) }) });
}

/** A short human summary: the verdict first, then what to do about each finding that matters. */
export function formatText(r: AnalysisResult): string {
  const lines = [
    `verdict: ${r.verdict}  (compatibility: ${r.compatibility}, suggested version bump: ${r.suggested_version_bump})`,
    `changes: ${r.summary.total_changes} total, ${r.summary.breaking} breaking, ${r.summary.potentially_breaking} potentially breaking, ${r.summary.unknown} unknown, ${r.summary.compatible} compatible, ${r.summary.non_contract} docs-only`,
  ];
  if (r.impact) {
    lines.push(
      `for the ${r.impact.uses} operation(s) you use: ${r.impact.verdict} (${r.impact.affecting.breaking} breaking, ${r.impact.affecting.potentially_breaking} potentially breaking, ${r.impact.affecting.unknown} unknown)`,
    );
    for (const u of r.impact.not_in_before)
      lines.push(`  note: ${u.method} ${u.path} is not in the "before" document`);
  }
  const shown = new Set(r.impact ? r.impact.change_ids : r.changes.map((c) => c.id));
  for (const c of r.changes) {
    if (!shown.has(c.id) || c.compatibility === "compatible" || c.compatibility === "non_contract") continue;
    lines.push(`- [${c.compatibility}] ${c.reason}`, `  → ${c.recommended_action}`);
  }
  for (const l of r.limitations) lines.push(`limitation: ${l}`);
  lines.push(`analysis_id: ${r.analysis_id}`);
  return lines.join("\n");
}

/**
 * Free local mode (D-039): the same engine as the hosted API, run on your own machine with no wallet and no
 * network access. Shared by the CLI and the MCP server.
 */
import { readFileSync, statSync } from "node:fs";
import { type AnalysisResult, analyze } from "./analyze";
import { BreakraError } from "./core/errors";
import { LOCAL_LIMITS } from "./core/limits";
import type { JsonObject } from "./core/validate";
import { parseUses, type UsedOperation } from "./core/verdict";
import { parseWithLocation, safeLabel } from "./hints";

/** Reads a local OpenAPI file (JSON or YAML), up to 25 MB (D-049). Errors name the file and say why. */
export function readSpecFile(path: string, side: "before" | "after"): JsonObject {
  const label = safeLabel(path);
  const unreadable = (e: unknown): BreakraError => {
    const code = (e as NodeJS.ErrnoException | undefined)?.code;
    const [reason, why] =
      code === "ENOENT" || code === "ENOTDIR"
        ? ["not_found", "no such file"]
        : code === "EACCES" || code === "EPERM"
          ? ["permission_denied", "permission denied"]
          : code === "EISDIR"
            ? ["is_directory", "it is a folder"]
            : ["unreadable", "it could not be read"];
    return new BreakraError("INVALID_REQUEST", `Cannot read the "${side}" file ${label}: ${why}.`, {
      side,
      path: label,
      reason,
    });
  };
  let stat: ReturnType<typeof statSync>;
  try {
    stat = statSync(path);
  } catch (e) {
    throw unreadable(e);
  }
  if (stat.isDirectory()) throw unreadable({ code: "EISDIR" });
  if (stat.size > LOCAL_LIMITS.maxBodyBytes) {
    throw new BreakraError("PAYLOAD_TOO_LARGE", `The "${side}" file ${label} exceeds 25 MB.`, {
      side,
      path: label,
    });
  }
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    throw unreadable(e);
  }
  return parseWithLocation(text, side, label);
}

/** "GET /orders/{id}" → { method, path }. */
export function parseUseFlag(text: string): UsedOperation {
  const [method, path, ...rest] = text.trim().split(/\s+/);
  try {
    return parseUses([
      { method, path: rest.length ? `${path} ${rest.join(" ")}` : path },
    ])[0] as UsedOperation;
  } catch (e) {
    if (e instanceof BreakraError) {
      throw new BreakraError(
        "INVALID_REQUEST",
        `--use "${safeLabel(text).slice(0, 80)}" is not METHOD and path.`,
        {
          reason: "use",
        },
      );
    }
    throw e;
  }
}

export async function analyzeLocal(
  before: JsonObject,
  after: JsonObject,
  uses?: unknown,
): Promise<AnalysisResult> {
  return analyze(
    { before, after, ...(uses === undefined ? {} : { uses: parseUses(uses) }) },
    undefined,
    LOCAL_LIMITS,
  );
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

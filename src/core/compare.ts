import { compareOpenApi } from "api-smart-diff";
import type { Json, JsonObject } from "./validate";

/** A raw structural change. Classification is done by Breakra's own rules (classify.ts), never by the library. */
export interface RawDiff {
  action: "add" | "remove" | "replace" | "rename";
  path: Array<string | number>;
  before: Json | undefined;
  after: Json | undefined;
}

export interface CompareResult {
  diffs: RawDiff[];
  /** Both documents merged with local $refs inlined; used to look up context (e.g. parameter names). */
  merged: Json;
}

const CONSOLE_METHODS = ["log", "info", "warn", "error", "debug"] as const;

/**
 * Runs `fn` with console output discarded. api-smart-diff 1.0.6 calls console.error with document paths
 * (e.g. "Classification Rule error for node: components.schemas.…") on some inputs, which would put parts
 * of submitted specs into the host's logs (D-026). The call is synchronous, so no other request's logging
 * can be swallowed.
 */
function silenced<T>(fn: () => T): T {
  const saved = CONSOLE_METHODS.map((m) => console[m]);
  for (const m of CONSOLE_METHODS) console[m] = () => {};
  try {
    return fn();
  } finally {
    CONSOLE_METHODS.forEach((m, i) => {
      console[m] = saved[i] as (typeof console)[typeof m];
    });
  }
}

/**
 * Wrapper around api-smart-diff 1.0.6 (pinned). Isolated here so the engine can be swapped or vendored
 * without touching classification (D-013). The library's own breaking/non-breaking labels are discarded.
 */
export function compareSpecs(before: JsonObject, after: JsonObject): CompareResult {
  const result = silenced(() => compareOpenApi(structuredClone(before), structuredClone(after)));
  const diffs: RawDiff[] = result.diffs.map((d) => ({
    action: d.action as RawDiff["action"],
    path: [...(d.path as Array<string | number>)],
    before: d.before as Json | undefined,
    after: d.after as Json | undefined,
  }));
  return { diffs, merged: result.merged as Json };
}

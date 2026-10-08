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

/**
 * Wrapper around api-smart-diff 1.0.6 (pinned). Isolated here so the engine can be swapped or vendored
 * without touching classification (D-013). The library's own breaking/non-breaking labels are discarded.
 */
export function compareSpecs(before: JsonObject, after: JsonObject): CompareResult {
  const result = compareOpenApi(structuredClone(before), structuredClone(after));
  const diffs: RawDiff[] = result.diffs.map((d) => ({
    action: d.action as RawDiff["action"],
    path: [...(d.path as Array<string | number>)],
    before: d.before as Json | undefined,
    after: d.after as Json | undefined,
  }));
  return { diffs, merged: result.merged as Json };
}

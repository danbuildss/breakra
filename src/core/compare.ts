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
  const result = silenced(() =>
    compareOpenApi(
      inlineLeafVariantRefs(structuredClone(before)),
      inlineLeafVariantRefs(structuredClone(after)),
    ),
  );
  const diffs: RawDiff[] = result.diffs.map((d) => ({
    action: d.action as RawDiff["action"],
    path: [...(d.path as Array<string | number>)],
    before: d.before as Json | undefined,
    after: d.after as Json | undefined,
  }));
  return { diffs, merged: result.merged as Json };
}

/**
 * D-050 (Orric #2): api-smart-diff wraps a bare `{"$ref": …}` option of `anyOf`/`oneOf` in an `allOf` without
 * resolving it, so an inline enum refactored into a shared component reads as values removed. Replace such an
 * option with a copy of its target, but only when the target holds no `$ref` itself (no recursion, no growth
 * beyond one level). Applied to both documents, so it is symmetric. Mutates and returns the given clone.
 */
export function inlineLeafVariantRefs(doc: JsonObject): JsonObject {
  const containsRef = (node: Json): boolean =>
    Array.isArray(node)
      ? node.some(containsRef)
      : node !== null && typeof node === "object"
        ? typeof node.$ref === "string" || Object.values(node).some(containsRef)
        : false;
  const target = (ref: string): Json | undefined => {
    if (!ref.startsWith("#/")) return undefined;
    let node: Json | undefined = doc;
    for (const raw of ref.slice(2).split("/")) {
      const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
      if (node === null || typeof node !== "object" || Array.isArray(node)) return undefined;
      node = node[key];
      if (node === undefined) return undefined;
    }
    return node;
  };
  const visit = (node: Json): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (node === null || typeof node !== "object") return;
    for (const kw of ["anyOf", "oneOf"] as const) {
      const variants = node[kw];
      if (!Array.isArray(variants)) continue;
      variants.forEach((v, i) => {
        if (v === null || typeof v !== "object" || Array.isArray(v)) return;
        const keys = Object.keys(v);
        if (keys.length !== 1 || typeof v.$ref !== "string") return;
        const t = target(v.$ref);
        if (t !== undefined && t !== null && typeof t === "object" && !Array.isArray(t) && !containsRef(t)) {
          variants[i] = structuredClone(t);
        }
      });
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(doc);
  return doc;
}

import { BreakraError } from "./errors";
import { LIMITS } from "./limits";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export interface AnalyzeInput {
  before: JsonObject;
  after: JsonObject;
}

export interface ExternalRef {
  side: "before" | "after";
  ref: string;
  pointer: string;
}

export interface ValidatedSpec {
  spec: JsonObject;
  version: string;
  externalRefs: ExternalRef[];
}

const SUPPORTED_VERSION = /^3\.0\.[0-4]$/;
const HTTP_METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch", "trace"]);

export function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses and shape-checks the request body. Never echoes body content in errors. */
export function parseRequestBody(bytes: Uint8Array): AnalyzeInput {
  if (bytes.byteLength > LIMITS.maxBodyBytes) {
    throw new BreakraError("PAYLOAD_TOO_LARGE", "Request body exceeds the 2 MB limit.", {
      limit_bytes: LIMITS.maxBodyBytes,
    });
  }
  if (bytes.byteLength === 0) {
    throw new BreakraError(
      "INVALID_REQUEST",
      'Request body is empty. Send {"before": {...}, "after": {...}}.',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new BreakraError("INVALID_REQUEST", "Request body is not valid UTF-8 JSON.");
  }
  if (!isObject(parsed)) {
    throw new BreakraError(
      "INVALID_REQUEST",
      'Request body must be a JSON object: {"before": {...}, "after": {...}}.',
    );
  }
  const keys = Object.keys(parsed).sort();
  if (keys.length !== 2 || keys[0] !== "after" || keys[1] !== "before") {
    throw new BreakraError(
      "INVALID_REQUEST",
      'Request body must contain exactly two fields, "before" and "after", each an inline OpenAPI 3.0 JSON document. URL inputs are not supported.',
    );
  }
  if (!isObject(parsed.before) || !isObject(parsed.after)) {
    throw new BreakraError(
      "INVALID_REQUEST",
      '"before" and "after" must both be JSON objects (OpenAPI documents).',
    );
  }
  return { before: parsed.before, after: parsed.after };
}

function escapePointer(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** Resolves a local JSON pointer ("#/a/b") inside `root`, or returns undefined. */
export function resolveLocalRef(root: JsonObject, ref: string): Json | undefined {
  if (ref === "#") return root;
  if (!ref.startsWith("#/")) return undefined;
  let node: Json | undefined = root;
  for (const raw of ref.slice(2).split("/")) {
    const key = decodeURIComponent(raw).replace(/~1/g, "/").replace(/~0/g, "~");
    if (Array.isArray(node)) {
      const index = Number(key);
      node = Number.isInteger(index) ? node[index] : undefined;
    } else if (isObject(node)) {
      node = Object.hasOwn(node, key) ? node[key] : undefined;
    } else {
      return undefined;
    }
    if (node === undefined) return undefined;
  }
  return node;
}

/**
 * Single iterative walk: depth, node count and $ref inventory. Iterative so hostile nesting cannot
 * overflow the stack.
 */
function scan(
  spec: JsonObject,
  side: "before" | "after",
): { localRefs: string[]; externalRefs: ExternalRef[] } {
  const localRefs: string[] = [];
  const externalRefs: ExternalRef[] = [];
  const stack: Array<{ node: Json; depth: number; pointer: string }> = [
    { node: spec, depth: 1, pointer: "" },
  ];
  let nodes = 0;
  while (stack.length > 0) {
    const { node, depth, pointer } = stack.pop() as { node: Json; depth: number; pointer: string };
    nodes += 1;
    if (nodes > LIMITS.maxNodes) {
      throw new BreakraError("SPEC_TOO_COMPLEX", `The "${side}" document has too many elements.`, {
        limit_nodes: LIMITS.maxNodes,
      });
    }
    if (depth > LIMITS.maxDepth) {
      throw new BreakraError("SPEC_TOO_COMPLEX", `The "${side}" document is nested too deeply.`, {
        limit_depth: LIMITS.maxDepth,
      });
    }
    if (Array.isArray(node)) {
      node.forEach((child, i) => {
        stack.push({ node: child, depth: depth + 1, pointer: `${pointer}/${i}` });
      });
    } else if (isObject(node)) {
      // A non-string "$ref" is an ordinary key (e.g. a schema property named "$ref"), not a reference.
      const ref = node.$ref;
      if (typeof ref === "string") {
        if (ref.startsWith("#")) localRefs.push(ref);
        else externalRefs.push({ side, ref, pointer: `${pointer}/$ref` });
      }
      for (const [key, child] of Object.entries(node)) {
        stack.push({ node: child, depth: depth + 1, pointer: `${pointer}/${escapePointer(key)}` });
      }
    }
  }
  return { localRefs, externalRefs };
}

/**
 * Size of the document if every local $ref were inlined, computed without inlining
 * (memoized per node; a $ref cycle counts once). Rejects "ref bombs" before the diff runs.
 */
function expandedSize(spec: JsonObject, side: "before" | "after"): number {
  const memo = new Map<object, number>();
  const inProgress = new Set<object>();
  const sizeOf = (node: Json): number => {
    if (node === null || typeof node !== "object") return 1;
    const cached = memo.get(node);
    if (cached !== undefined) return cached;
    if (inProgress.has(node)) return 1;
    inProgress.add(node);
    let total = 1;
    if (Array.isArray(node)) {
      for (const child of node) total += sizeOf(child);
    } else if (typeof node.$ref === "string" && node.$ref.startsWith("#")) {
      const target = resolveLocalRef(spec, node.$ref);
      total += target === undefined ? 0 : sizeOf(target);
    } else {
      for (const child of Object.values(node)) total += sizeOf(child);
    }
    if (total > LIMITS.maxExpandedNodes) {
      throw new BreakraError(
        "SPEC_TOO_COMPLEX",
        `The "${side}" document expands to too many elements once $refs are resolved.`,
        { limit_expanded_nodes: LIMITS.maxExpandedNodes },
      );
    }
    inProgress.delete(node);
    memo.set(node, total);
    return total;
  };
  try {
    return sizeOf(spec);
  } catch (err) {
    if (err instanceof RangeError) {
      // Extremely long $ref chains exhaust the call stack: treat as too complex, not as a crash.
      throw new BreakraError("SPEC_TOO_COMPLEX", `The "${side}" document has $ref chains that are too long.`);
    }
    throw err;
  }
}

/** Structural checks for an OpenAPI 3.0.x document. Lenient on optional fields, strict on shape. */
export function validateSpec(spec: JsonObject, side: "before" | "after"): ValidatedSpec {
  const invalid = (message: string, pointer?: string): BreakraError =>
    new BreakraError(
      "INVALID_SPECIFICATION",
      `The "${side}" document is not a valid OpenAPI 3.0 document: ${message}`,
      {
        side,
        ...(pointer ? { pointer } : {}),
      },
    );

  if ("swagger" in spec) {
    throw new BreakraError(
      "UNSUPPORTED_OPENAPI_VERSION",
      `The "${side}" document is Swagger 2.0. Only OpenAPI 3.0.x is supported.`,
      {
        side,
      },
    );
  }
  const version = spec.openapi;
  if (typeof version !== "string") throw invalid('missing the "openapi" version field.', "/openapi");
  if (!SUPPORTED_VERSION.test(version)) {
    throw new BreakraError(
      "UNSUPPORTED_OPENAPI_VERSION",
      `The "${side}" document declares OpenAPI ${version.slice(0, 20)}. Only OpenAPI 3.0.0–3.0.4 is supported.`,
      { side },
    );
  }
  const info = spec.info;
  if (!isObject(info) || typeof info.title !== "string" || typeof info.version !== "string") {
    throw invalid('"info" must be an object with string "title" and "version".', "/info");
  }
  const paths = spec.paths;
  if (!isObject(paths)) throw invalid('"paths" must be an object.', "/paths");

  let operations = 0;
  for (const [pathKey, item] of Object.entries(paths)) {
    const itemPointer = `/paths/${escapePointer(pathKey)}`;
    if (!pathKey.startsWith("/"))
      throw invalid(`path "${pathKey.slice(0, 80)}" must start with "/".`, itemPointer);
    if (!isObject(item)) throw invalid("each path item must be an object.", itemPointer);
    if ("parameters" in item && !Array.isArray(item.parameters)) {
      throw invalid('"parameters" must be an array.', `${itemPointer}/parameters`);
    }
    for (const [method, op] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method)) continue;
      operations += 1;
      const opPointer = `${itemPointer}/${method}`;
      if (!isObject(op)) throw invalid("each operation must be an object.", opPointer);
      if ("parameters" in op && !Array.isArray(op.parameters)) {
        throw invalid('"parameters" must be an array.', `${opPointer}/parameters`);
      }
      if ("responses" in op && !isObject(op.responses)) {
        throw invalid('"responses" must be an object.', `${opPointer}/responses`);
      }
    }
  }
  if (operations > LIMITS.maxOperations) {
    throw new BreakraError("SPEC_TOO_COMPLEX", `The "${side}" document has too many operations.`, {
      limit_operations: LIMITS.maxOperations,
    });
  }

  const { localRefs, externalRefs } = scan(spec, side);
  for (const ref of new Set(localRefs)) {
    if (resolveLocalRef(spec, ref) === undefined) {
      throw invalid(`$ref "${ref.slice(0, 200)}" does not resolve.`);
    }
  }
  expandedSize(spec, side);
  return { spec, version, externalRefs };
}

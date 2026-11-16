import type { Change, Compatibility } from "./classify";
import { BreakraError } from "./errors";
import { isObject } from "./validate";

export type Verdict = "safe" | "review" | "block";
export type VersionBump = "major" | "minor" | "patch" | "none";

export interface UsedOperation {
  method: string;
  path: string;
}

/** One word an agent can act on: block on breaking, review on potentially breaking or unknown. */
export function verdictFor(counts: Record<Compatibility, number>): Verdict {
  if (counts.breaking > 0) return "block";
  if (counts.potentially_breaking > 0 || counts.unknown > 0) return "review";
  return "safe";
}

/**
 * Semver advice for the API's own version. Conservative: anything that may break a caller, or that the rules
 * could not evaluate, is a major bump.
 */
export function versionBumpFor(counts: Record<Compatibility, number>): VersionBump {
  if (counts.breaking + counts.potentially_breaking + counts.unknown > 0) return "major";
  if (counts.compatible > 0) return "minor";
  if (counts.non_contract > 0) return "patch";
  return "none";
}

const MAX_USES = 1_000;
const METHODS = new Set(["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"]);

/** Path templates match regardless of parameter names: /orders/{id} and /orders/{orderId} are one operation. */
export function operationKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path.replace(/\{[^}]*\}/g, "{}")}`;
}

/** Validates the optional `uses` list. Never echoes its content in errors. */
export function parseUses(raw: unknown): UsedOperation[] {
  const bad = () =>
    new BreakraError(
      "INVALID_REQUEST",
      `"uses" must be an array of up to ${MAX_USES} objects {"method": "GET", "path": "/orders/{id}"}.`,
    );
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_USES) throw bad();
  return raw.map((u) => {
    if (!isObject(u) || typeof u.method !== "string" || typeof u.path !== "string") throw bad();
    const method = u.method.toUpperCase();
    if (!METHODS.has(method) || !u.path.startsWith("/") || u.path.length > 2_000) throw bad();
    return { method, path: u.path };
  });
}

export interface Impact {
  verdict: Verdict;
  uses: number;
  affecting: { breaking: number; potentially_breaking: number; unknown: number };
  /** Ids of the listed changes that affect the operations you use. */
  change_ids: string[];
  /** Operations you listed that the "before" document doesn't define (check for typos). */
  not_in_before: UsedOperation[];
}

/**
 * Which changes affect a caller that uses `uses`. A change affects you if it is on one of your operations, or
 * if it has no operation (document-wide, such as global security): those reach every caller.
 */
export function impactFor(
  uses: UsedOperation[],
  all: Change[],
  listed: Array<Change & { id: string }>,
  beforeOperations: Set<string>,
): Impact {
  const wanted = new Set(uses.map((u) => operationKey(u.method, u.path)));
  const affects = (c: Change) =>
    (c.compatibility === "breaking" ||
      c.compatibility === "potentially_breaking" ||
      c.compatibility === "unknown") &&
    (c.operation === null || wanted.has(operationKey(c.operation.method, c.operation.path)));
  const affecting = { breaking: 0, potentially_breaking: 0, unknown: 0 };
  for (const c of all) {
    if (affects(c)) affecting[c.compatibility as keyof typeof affecting] += 1;
  }
  const seen = new Set<string>();
  const notInBefore = uses.filter((u) => {
    const key = operationKey(u.method, u.path);
    if (seen.has(key) || beforeOperations.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    verdict: verdictFor({ ...affecting, compatible: 0, non_contract: 0 }),
    uses: wanted.size,
    affecting,
    change_ids: listed.filter(affects).map((c) => c.id),
    not_in_before: notInBefore,
  };
}

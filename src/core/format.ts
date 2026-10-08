import type { Change, Compatibility } from "./classify";
import { LIMITS } from "./limits";
import type { Json } from "./validate";

export const SEVERITY: Record<Compatibility, number> = {
  breaking: 4,
  potentially_breaking: 3,
  unknown: 2,
  compatible: 1,
  non_contract: 0,
};

const OVERALL_ORDER: Compatibility[] = [
  "breaking",
  "potentially_breaking",
  "unknown",
  "compatible",
  "non_contract",
];

export interface OutputChange extends Omit<Change, "evidence"> {
  id: string;
  evidence: { path: string[]; before: Json | null; after: Json | null; truncated?: boolean };
}

function sortKey(c: Change): string {
  return [
    String(9 - SEVERITY[c.compatibility]),
    c.operation?.path ?? "",
    c.operation?.method ?? "",
    c.direction,
    c.kind,
    JSON.stringify(c.location),
    c.evidence.path.join("\u0000"),
  ].join("\u0001");
}

function boundEvidence(v: Json | null): { value: Json | null; truncated: boolean } {
  if (v === null) return { value: null, truncated: false };
  const text = JSON.stringify(v);
  if (text.length <= LIMITS.maxEvidenceChars) return { value: v, truncated: false };
  return { value: `${text.slice(0, LIMITS.maxEvidenceChars)}…`, truncated: true };
}

/** Sorts deterministically, removes exact duplicates, assigns stable ids and bounds output size. */
export function finalizeChanges(changes: Change[]): {
  changes: OutputChange[];
  total: number;
  omitted: number;
} {
  const seen = new Set<string>();
  const unique: Change[] = [];
  for (const c of changes.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0))) {
    const key = JSON.stringify(c);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }
  const kept = unique.slice(0, LIMITS.maxChanges);
  const out = kept.map((c, i) => {
    const before = boundEvidence(c.evidence.before);
    const after = boundEvidence(c.evidence.after);
    const truncated = before.truncated || after.truncated;
    return {
      id: `change-${String(i + 1).padStart(3, "0")}`,
      ...c,
      evidence: {
        path: c.evidence.path,
        before: before.value,
        after: after.value,
        ...(truncated ? { truncated: true } : {}),
      },
    };
  });
  return { changes: out, total: unique.length, omitted: unique.length - kept.length };
}

export function summarize(all: Change[]) {
  const by: Record<Compatibility, number> = {
    breaking: 0,
    potentially_breaking: 0,
    unknown: 0,
    compatible: 0,
    non_contract: 0,
  };
  for (const c of all) by[c.compatibility] += 1;
  const overall = OVERALL_ORDER.find((k) => by[k] > 0 && k !== "non_contract") ?? "compatible";
  return { counts: by, overall };
}

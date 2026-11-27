import { canonicalize, canonicalJson, sha256Hex } from "./core/canonical";
import { type Change, classify } from "./core/classify";
import { compareSpecs } from "./core/compare";
import { finalizeChanges, summarize } from "./core/format";
import { HOSTED_LIMITS, type Limits } from "./core/limits";
import { type AnalyzeInput, isObject, type JsonObject, validateSpec } from "./core/validate";
import {
  type Impact,
  impactFor,
  operationKey,
  type Verdict,
  type VersionBump,
  verdictFor,
  versionBumpFor,
} from "./core/verdict";
import { ENGINE_VERSION, RULE_SET_VERSION } from "./version";

export interface AnalysisResult {
  status: "success";
  analysis_id: string;
  engine_version: string;
  rule_set_version: string;
  spec_versions: { before: string; after: string };
  compatibility: Change["compatibility"];
  /** block: breaking changes; review: potentially breaking or unknown; safe: nothing that may break callers. */
  verdict: Verdict;
  /** Semver advice for the API's own version (conservative: unknown counts as major). */
  suggested_version_bump: VersionBump;
  summary: {
    total_changes: number;
    breaking: number;
    potentially_breaking: number;
    unknown: number;
    compatible: number;
    non_contract: number;
  };
  changes: ReturnType<typeof finalizeChanges>["changes"];
  limitations: string[];
  /** Present only when the request listed the operations it uses (`uses`). */
  impact?: Impact;
  metadata: { input_hashes: { before: string; after: string }; changes_omitted: number; duration_ms: number };
}

/**
 * Pure analysis: validated inputs in, deterministic result out (every field except
 * metadata.duration_ms is a function of the inputs and the engine/rule-set versions).
 * Throws BreakraError for caller-facing failures.
 */
export async function analyze(
  input: AnalyzeInput,
  now: () => number = () => performance.now(),
  limits: Limits = HOSTED_LIMITS,
): Promise<AnalysisResult> {
  const started = now();
  const before = validateSpec(input.before, "before", limits);
  const after = validateSpec(input.after, "after", limits);

  const beforeCanonical = canonicalize(before.spec) as JsonObject;
  const afterCanonical = canonicalize(after.spec) as JsonObject;
  const [hashBefore, hashAfter] = await Promise.all([
    sha256Hex(canonicalJson(beforeCanonical)),
    sha256Hex(canonicalJson(afterCanonical)),
  ]);

  const { diffs, merged } = compareSpecs(beforeCanonical, afterCanonical);
  const all: Change[] = diffs.flatMap((d) => classify(d, merged));

  const limitations: string[] = [];
  const external = [...before.externalRefs, ...after.externalRefs];
  if (external.length > 0) {
    const sample = [...new Set(external.map((e) => e.ref))].sort().slice(0, 10);
    limitations.push(
      `External $refs are never fetched; content behind ${external.length} external reference(s) was not compared (e.g. ${sample.join(", ")}).`,
    );
  }

  const { counts, overall } = summarize(all);
  const { changes, total, omitted } = finalizeChanges([...all]);
  if (omitted > 0) {
    limitations.push(
      `Only the ${changes.length} most severe of ${total} changes are listed; summary counts include all of them.`,
    );
  }

  let impact: Impact | undefined;
  let usesPart = "";
  if (input.uses) {
    impact = impactFor(input.uses, all, changes, operationsOf(before.spec));
    const sorted = [...new Set(input.uses.map((u) => operationKey(u.method, u.path)))].sort();
    usesPart = `|uses:${await sha256Hex(sorted.join("\n"))}`;
  }
  const analysisId = await sha256Hex(
    `${ENGINE_VERSION}|${RULE_SET_VERSION}|${hashBefore}|${hashAfter}${usesPart}`,
  );
  return {
    status: "success",
    analysis_id: `sha256:${analysisId}`,
    engine_version: ENGINE_VERSION,
    rule_set_version: RULE_SET_VERSION,
    spec_versions: { before: before.version, after: after.version },
    compatibility: overall,
    verdict: verdictFor(counts),
    suggested_version_bump: versionBumpFor(counts),
    summary: { total_changes: total, ...counts },
    changes,
    limitations,
    ...(impact ? { impact } : {}),
    metadata: {
      input_hashes: { before: `sha256:${hashBefore}`, after: `sha256:${hashAfter}` },
      changes_omitted: omitted,
      duration_ms: Math.round(now() - started),
    },
  };
}

const METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

/** Every operation the document defines, as operationKey values. */
function operationsOf(spec: JsonObject): Set<string> {
  const out = new Set<string>();
  const paths = isObject(spec.paths) ? spec.paths : {};
  for (const [path, item] of Object.entries(paths)) {
    if (!isObject(item)) continue;
    for (const m of METHODS) if (isObject(item[m])) out.add(operationKey(m, path));
  }
  return out;
}

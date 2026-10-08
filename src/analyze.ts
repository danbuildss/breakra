import { canonicalize, canonicalJson, sha256Hex } from "./core/canonical";
import { type Change, classify } from "./core/classify";
import { compareSpecs } from "./core/compare";
import { finalizeChanges, summarize } from "./core/format";
import { type AnalyzeInput, type JsonObject, validateSpec } from "./core/validate";
import { ENGINE_VERSION, RULE_SET_VERSION } from "./version";

export interface AnalysisResult {
  status: "success";
  analysis_id: string;
  engine_version: string;
  rule_set_version: string;
  spec_versions: { before: string; after: string };
  compatibility: Change["compatibility"];
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
): Promise<AnalysisResult> {
  const started = now();
  const before = validateSpec(input.before, "before");
  const after = validateSpec(input.after, "after");

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
  const { changes, total, omitted } = finalizeChanges(all);
  if (omitted > 0) {
    limitations.push(
      `Only the ${changes.length} most severe of ${total} changes are listed; summary counts include all of them.`,
    );
  }

  const analysisId = await sha256Hex(`${ENGINE_VERSION}|${RULE_SET_VERSION}|${hashBefore}|${hashAfter}`);
  return {
    status: "success",
    analysis_id: `sha256:${analysisId}`,
    engine_version: ENGINE_VERSION,
    rule_set_version: RULE_SET_VERSION,
    spec_versions: { before: before.version, after: after.version },
    compatibility: overall,
    summary: { total_changes: total, ...counts },
    changes,
    limitations,
    metadata: {
      input_hashes: { before: `sha256:${hashBefore}`, after: `sha256:${hashAfter}` },
      changes_omitted: omitted,
      duration_ms: Math.round(now() - started),
    },
  };
}

/**
 * Input bounds (D-024). All work is bounded *before* the diff runs, because a synchronous diff
 * cannot be interrupted and Bankr hard-stops handlers at 30 s. Values are calibrated in docs/project/BENCHMARKS.md.
 */
export const LIMITS = {
  /**
   * Request body, before + after combined. Lowered from 2 MB (D-031): on Bankr a 2 MB real pair took
   * 16.7 s of handler time and 26.7 s end to end against the 30 s gateway cap.
   */
  maxBodyBytes: 1024 * 1024,
  /** Maximum JSON nesting depth of either document. */
  maxDepth: 64,
  /** Maximum number of JSON nodes in either document as submitted. */
  maxNodes: 300_000,
  /** Maximum number of operations (path + method) in either document. */
  maxOperations: 5_000,
  /**
   * Maximum JSON nodes after expanding local $refs: the best proxy for analysis time. Guards against
   * "ref bombs" (a ~2 KB document with 16 levels of doubled $refs yields ~200k raw diffs). Lowered from
   * 400k (D-031): on Bankr, 135k expanded nodes took 16.7 s of handler time; 75k targets ≤ ~9 s.
   */
  maxExpandedNodes: 75_000,
  /**
   * Maximum changes listed; the rest are counted in the summary and reported as a limitation.
   * Together with maxEvidenceChars this bounds the response to ~1.5 MB, well under the ~6 MB
   * response limit of Bankr's Lambda-backed runtime.
   */
  maxChanges: 500,
  /** Maximum serialized size of each evidence value (before/after). */
  maxEvidenceChars: 1_000,
} as const;

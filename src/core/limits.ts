/**
 * Input bounds (D-024). All work is bounded *before* the diff runs, because a synchronous diff
 * cannot be interrupted and Bankr hard-stops handlers at 30 s. Values are calibrated in BENCHMARKS.md.
 */
export const LIMITS = {
  /** Request body, before + after combined. Bankr's gateway rejects > ~6 MB anyway (T-001 T9). */
  maxBodyBytes: 2 * 1024 * 1024,
  /** Maximum JSON nesting depth of either document. */
  maxDepth: 64,
  /** Maximum number of JSON nodes in either document as submitted. */
  maxNodes: 300_000,
  /** Maximum number of operations (path + method) in either document. */
  maxOperations: 5_000,
  /**
   * Maximum JSON nodes after expanding local $refs. Guards against "ref bombs": a ~2 KB document with
   * 16 levels of doubled $refs yields ~200k raw diffs. Calibrated in BENCHMARKS.md: real GitHub API
   * slices at the 2 MB body cap expand to ~135k nodes; the worst accepted synthetic bomb stays ~200 MB RSS.
   */
  maxExpandedNodes: 400_000,
  /**
   * Maximum changes listed; the rest are counted in the summary and reported as a limitation.
   * Together with maxEvidenceChars this bounds the response to ~1.5 MB, well under the ~6 MB
   * response limit of Bankr's Lambda-backed runtime.
   */
  maxChanges: 500,
  /** Maximum serialized size of each evidence value (before/after). */
  maxEvidenceChars: 1_000,
} as const;

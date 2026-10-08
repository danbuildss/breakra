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
   * Maximum JSON nodes after expanding local $refs. Guards against "ref bombs": a ~2 KB document
   * with 16 levels of doubled $refs yields ~200k raw diffs (measured in Phase 1 exploration).
   */
  maxExpandedNodes: 1_500_000,
  /** Maximum changes returned; the rest are counted and reported as a limitation. */
  maxChanges: 1_000,
  /** Maximum serialized size of each evidence value. */
  maxEvidenceChars: 2_000,
} as const;

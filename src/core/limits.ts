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
  /**
   * Largest `oneOf`/`anyOf` that may *change* between the two documents (D-050, Orric #16). The diff library
   * matches the options of a changed union pairwise: measured locally on WorkOS GET /events, 16 options 1.1 s,
   * 32 → 2.5 s, 64 → 13.8 s, 96 → 48 s, 128→138 → about 120 s (the same 138-option union unchanged: 1.5 s).
   * Only unions with options both removed/edited and added count: one edited option in 138 already takes 5 s, while
   * pure additions stay cheap (GitHub's 22 → 35-option anyOf). Bankr runs about 9× slower than local, so the hosted
   * bound keeps that well under the 30 s gateway cap.
   */
  maxChangedUnionOptions: 24,
} as const;

/** The hosted limits under the name the local profile is compared with. */
export const HOSTED_LIMITS = LIMITS;

/** A set of input bounds: the hosted API's, or the local tools'. */
export type Limits = { readonly [K in keyof typeof LIMITS]: number };

/**
 * Local profile (D-049): the CLI, MCP server and GitHub Action run on the caller's own machine, where
 * Bankr's 30 s gateway cap doesn't apply, so they accept GitHub-scale specs. Measured locally: GitHub's full
 * REST description (6.3–7 MB, 234k nodes, 1.7M expanded) compares in about 7 s and 400 MB. The expanded-node
 * bound still stops $ref bombs and pathological sharing: Stripe's spec (150k nodes) expands to about 1.3e12
 * and is rejected, because the engine would report each shared-schema change once per use (26 s, 4.3 GB,
 * 280k changes for one release). Output bounds (maxChanges, maxEvidenceChars) and depth stay as hosted, so
 * the result has the same shape everywhere; analysis_id never depends on limits.
 */
export const LOCAL_LIMITS: Limits = {
  ...LIMITS,
  /** Per document (one file, or one inline text), not per request. */
  maxBodyBytes: 25 * 1024 * 1024,
  maxNodes: 2_000_000,
  maxOperations: 20_000,
  maxExpandedNodes: 5_000_000,
  maxChangedUnionOptions: 64,
};

# Breakra benchmark

**Results:** [`RESULTS.md`](RESULTS.md) (generated) · data: [`results.json`](results.json) · run: `bun run benchmark`

## What it measures
1. **Real API history.** Consecutive major versions of GitHub's REST API description (`@octokit/openapi` on npm, MIT) and tagged versions of Stripe's OpenAPI spec (`github.com/stripe/openapi`, MIT).
   - **What counts as changed:** a path counts as changed if it, or any schema it references, changed.
   - **Sampling:** for each pair, an **evenly spaced sample of up to 25 changed paths** is compared. The rule is deterministic, so no alphabetical slice dominates.
   - **Limits:** paths that exceed Breakra's request limits (1 MB, 75,000 expanded nodes) are **counted as skipped, never reported as safe**.
   - **Reproducing:** the specs aren't committed because of their size (GitHub tarballs are cached in `.bench/`; Stripe specs are kept in memory only, never written to disk). `results.json` records each input's SHA-256, so anyone can reproduce the results from the same sources.
2. **Curated scenarios** (`curated/*.json`). One small contract pair per scenario, each with the **expected** outcome:
   - a removed endpoint;
   - a new required parameter;
   - a field that keeps its name but changes type;
   - a response enum value added;
   - OpenAPI 3.1 null and numeric bounds;
   - authentication added;
   - a malformed contract (must fail closed, with an error and never a verdict);
   - Swagger 2.0 (unsupported, so an error);
   - an external `$ref` (never fetched, so never cleared as safe).

   Several came from developer questions on X.

## Hand-checked findings (2026-11-20)
| Pair | Finding | Check | Result |
|---|---|---|---|
| GitHub 20→21 | `operation_removed`: GET /users/{user_id}/projectsV2/{project_number}/fields/{field_id} | Absent from the **full** v21 spec? | ✅ Confirmed |
| GitHub 22→23 | `operation_removed`: GET and PATCH /organizations/{org}/dependabot/repository-access | Absent from the full v23 spec? | ✅ Confirmed (both) |
| GitHub 18→19 | `response.property_removed` inside `oneOf` branches 15/16 of GET /orgs/{org}/rulesets (engine 0.2.0) | Real removal, or reordered variants? | ✅ **Was over-reporting; fixed in engine 0.3.0.** The `oneOf` options are `$ref`s. Engine 0.3.0 compares a leaf `$ref` option as the schema it points to (D-050): 0.3.1 reported 8 removed and 4 newly optional properties on this operation, 0.4.0 reports none. |

## Known limitations surfaced
- **Very large APIs (Stripe) are not assessed within the limits.** Every changed Stripe operation, even alone, expands past 75,000 nodes once `$ref`s are resolved. Breakra refuses such input (a free 422) rather than risk a timeout, and the benchmark reports these pairs as **not assessed**. Raising the local CLI's limits (it has no 30 s gateway cap) is a roadmap candidate.
- **Position-based `oneOf`/`anyOf` comparison** can over-report changes when variants are reordered. Matching variants by content is a roadmap candidate.
- **Expected outcomes for curated cases are written by the maintainer**, so they test intended behaviour. For real cases, only hand-checked findings are claimed as correct; everything else is reported as Breakra's output.

# Phase 1 — Core Engine: Plan for Approval

**Status:** PROPOSED, awaiting owner approval (2026-10-08).
**Approving this plan also approves D-023 to D-026** (DECISIONS.md).
**Goal:** a correct, deterministic, well-tested Breakra engine and a single-file Bankr-ready handler, **built and verified locally and in CI**.
**Not in Phase 1:** payments, deployment, spending, publishing, URL mode, YAML, OpenAPI 3.1.

---

## 1. What gets built

| Task | What | Output |
|---|---|---|
| **T-101 Project setup** | TypeScript (strict), Bun for build and runtime parity with Bankr, Vitest for tests, Biome for lint/format, lockfile. `api-smart-diff` pinned to **exactly 1.0.6**. GitHub Actions CI on every PR: install from lockfile → typecheck → lint → tests → build → bundle smoke test → oasdiff cross-check. | `package.json`, `tsconfig.json`, `.github/workflows/ci.yml` |
| **T-102 Input validation and limits** | Accept `POST` with JSON `{ "before": {...}, "after": {...} }` and nothing else. Reject with a clear 4xx JSON error (free for the caller, D-023): bad JSON, a missing or extra field, a non-object spec, an unsupported version (only 3.0.0–3.0.4), structurally invalid OpenAPI, body > **2 MB** (D-024), nesting too deep, too many paths or schemas. **Remote/file `$ref`s are never fetched.** They're reported as `unknown`. | `src/core/validate.ts`, `src/core/limits.ts`, `src/core/errors.ts` |
| **T-103 Comparison** | Canonicalize both specs (sorted keys, so formatting and key order don't matter). Run `api-smart-diff` behind our own `compare()` wrapper, so the library can be swapped or vendored later. Its built-in labels are ignored. | `src/core/normalize.ts`, `src/core/compare.ts` |
| **T-104 Risk rules (rule set 0.1.0)** | Breakra's own rules (AUDIT §7) map each raw change to `compatible` / `potentially_breaking` / `breaking` / `unknown` / `non_contract`, with **request vs response direction**. Each rule has an ID, a `reason` and a `recommended_action`. Wording is always "may break consumers that…", never "will break". Unsupported constructs give `unknown`, never silence. | `src/core/classify.ts`, `RULES.md` (rules table) |
| **T-105 Response** | The agreed JSON (AUDIT §6): `status`, `analysis_id` (sha256 of versions and input hashes), `engine_version`, `rule_set_version`, `spec_versions`, `summary` counts, overall `compatibility` (the worst change), `changes[]` with `kind`, `operation`, `direction`, `compatibility`, `reason`, `evidence {before, after, pointer}` and `recommended_action`, plus `limitations[]` and `metadata` (duration, input hashes). **Same input gives byte-identical output.** | `src/core/format.ts`, `docs/API.md` |
| **T-106 Handler and single-file build** | `src/index.ts` with the literal `export default async function handler(req: Request): Promise<Response>` (D-025). It returns 2xx **only** on a complete analysis. Internal errors return a sanitized 500 (free for the caller, no stack traces). It never logs bodies or `x-forwarded-for` (D-026). A build script produces **one self-contained file** `dist/x402/breakra-analyze/index.ts` with no imports, then smoke-tests it under Bun. | `src/index.ts`, `scripts/build.ts` |
| **T-107 Tests and oracle** | Fixtures and tests for every TESTING.md case (§3). **oasdiff** (Go) runs in CI on every fixture pair as an independent cross-check. Differences fail the build unless they're explicitly documented in `tests/oracle-differences.md`. | `tests/**`, `tests/fixtures/**` |
| **T-108 Benchmark and docs** | Measure time and memory for small, medium and large real specs. Set the final size/complexity caps so the worst case stays well under **20 s** (D-024). Real Bankr arm64 timing comes in Phase 3. Update ARCHITECTURE, TESTING, PLAN, TASKS and notes. | `BENCHMARKS.md`, doc updates |

## 2. Error contract (all non-2xx, so all free for the caller, verified in T-001)

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `INVALID_REQUEST` | Not JSON, wrong shape, missing or extra fields |
| 405 | `METHOD_NOT_ALLOWED` | Anything other than POST |
| 413 | `PAYLOAD_TOO_LARGE` | Body > 2 MB |
| 422 | `INVALID_SPECIFICATION` | Not a structurally valid OpenAPI document |
| 422 | `UNSUPPORTED_OPENAPI_VERSION` | Not 3.0.x (e.g. Swagger 2.0, 3.1) |
| 422 | `SPEC_TOO_COMPLEX` | Exceeds depth/path/schema caps |
| 500 | `ANALYSIS_FAILED` | Unexpected internal error (sanitized message) |

Every error is `{ "status": "error", "error": { "code", "message", "retryable" } }`, with no stack traces or internals.

## 3. Test plan (minimum)

- **Validation:** valid 3.0.x; invalid JSON; missing fields; extra fields; Swagger 2.0 and 3.1 rejected; oversized body; deep nesting; too many paths; remote `$ref` gives `unknown` with no network call (the network is stubbed to fail the test if touched); circular `$ref` OK.
- **Comparison and rules:** no changes; endpoint added/removed; required/optional param added; param removed; request property became required; request type changed; request enum narrowed/widened; response property removed/added; response enum widened; success status removed; error status removed; media type removed; security added/removed/changed; description-only change gives `non_contract`; reordered keys and reformatted JSON give **identical** output.
- **The 14-change fixture** from the Phase 0 bake-off: all 14 detected with the correct class and direction.
- **Determinism:** each fixture run twice gives byte-identical JSON and the same `analysis_id`.
- **Handler:** POST happy path returns 200; every error code returns the right status; no 2xx on failure; an injected internal exception gives a sanitized 500; logs contain no body or IP.
- **Bundle:** the built single file has no `import` statements, ends with the literal default-function export, and returns 200 with a correct result under Bun.
- **Oracle:** oasdiff agrees on breaking/non-breaking for every fixture, or the difference is documented.
- **Benchmark:** recorded timings; caps justified.

## 4. Acceptance criteria (Phase 1 is "done" only when all are true)

1. CI is green on the PR: typecheck, lint, all tests, build, bundle smoke test, oasdiff cross-check.
2. All 14 bake-off changes are detected and classified per the rule set, with evidence pointers.
3. Every invalid input returns the documented 4xx. No path returns 2xx without a full analysis.
4. Output is deterministic (verified by tests).
5. The single-file bundle builds and runs under Bun with no imports.
6. Size/complexity caps are set from recorded benchmarks, with worst case ≤ 20 s locally (with margin).
7. Docs are updated: API.md, RULES.md, BENCHMARKS.md, ARCHITECTURE, TESTING, PLAN, TASKS, notes.
8. Delivered as **one PR to `main`** with an end-of-phase report (CLAUDE.md format). **Nothing is deployed.**

## 5. Risks and how they're handled

| Risk | Mitigation |
|---|---|
| api-smart-diff's own labels are buggy (seen in Phase 0) | We ignore them. Classification comes only from our rules, cross-checked by oasdiff |
| api-smart-diff is unmaintained (last release Jul 2024) | Pinned, wrapped behind `compare()`; MIT licensed, so it can be vendored or forked if needed |
| A large spec could exceed 20 s on Bankr's arm64 | Conservative caps from local benchmarks now; confirmed on Bankr in Phase 3 |
| A synchronous diff can't be interrupted mid-way | Bound the work *before* diffing (size, depth, path/schema count caps) |
| oasdiff and our rules legitimately disagree on edge cases | Documented differences file. Our rules are explicit and versioned |

## 6. Decisions still needed from the owner (not blocking Phase 1)

- **License** for the repo (MIT is a candidate; brief §7). Needed before the repo or package is public.
- Domain and trademark clearance for Breakra (before launch).

## 7. How progress is reported

I'll work through T-101 to T-108 in order on the branch, commit as I go, and keep `notes.md` and `TASKS.md` current. I stop and ask only if something would change scope, the contract or a decision. At the end: one PR to `main` with the full report. **You review and merge.**

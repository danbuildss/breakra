# Breakra — Benchmarks and Limit Calibration (Phase 1, T-108)

**Date:** 2026-10-08 · **Engine** 0.1.0 · **Rule set** 0.1.0 · **Machine:** Claude's dev container (x86_64, Bun 1.4.2).
Bankr runs **arm64** with an unknown CPU allocation, so these numbers are **local**. Real Bankr timings are a Phase 3 task.
Reproduce with `bun scripts/bench.ts` (downloads `@octokit/openapi` into `.bench/`, which is gitignored).

## Real-world specs: GitHub API, v22.0.0 → v24.0.0, sliced by path count

| Paths | Before KB | After KB | Expanded nodes (max) | Time ms | RSS MB | Changes | Result |
|---|---|---|---|---|---|---|---|
| 10 | 58 | 107 | 6,402 | 152 | 158 | 13 | breaking |
| 40 | 417 | 406 | 31,505 | 513 | 169 | 258 | breaking |
| 80 | 618 | 644 | 87,720 | 1,112 | 185 | 516 | breaking |
| 120 | 788 | 835 | 113,397 | 1,483 | 204 | 629 | breaking |
| **160** | **991** | **994** | **134,817** | **1,712** | **208** | 711 | breaking |
| 200 | 1,168 | 1,235 | 157,446 | 2,189 | 226 | 856 | breaking |

The 160-path pair (about 1.9 MB combined) is the largest real pair under the **2 MB** body cap. The 200-path row is above the cap and is shown only for the trend.

## Adversarial / worst cases

| Case | Result |
|---|---|
| Two **disjoint** ~1 MB real slices (maximum changes), 1,882 KB body | 321 ms, 438 changes, **656 KB response**, 173 MB RSS |
| **$ref bomb**, depth 12 (accepted) | 185 ms, 4,096 changes, 96 MB RSS |
| **$ref bomb**, depth 13 (worst accepted under the cap) | 247 ms, 8,192 changes, 156 MB RSS |
| $ref bomb, depth ≥ 14 | **Rejected** (`SPEC_TOO_COMPLEX`, 422, free) in ~1 ms |
| $ref bomb, depth 15, *before* calibration (cap 1.5 M) | 2,469 ms and **430 MB RSS**. This is why the cap was lowered. |
| $ref bomb, depth 16, raw library (no guard) | 196,607 diffs, 1.2 s. Depth 20 would be millions of diffs and a timeout on Bankr. |

## Resulting limits (`src/core/limits.ts`, D-024)

| Limit | Value | Basis |
|---|---|---|
| Body (before + after) | 2 MB | D-024; real 1 MB/1 MB pairs run in about 1.7 s locally |
| Expanded nodes per spec | **400,000** | About 3× the largest real spec under the cap (135 k). Worst accepted bomb is about 156 MB |
| Raw nodes per spec | 300,000 | Bounds parsing and scanning |
| Nesting depth | 64 | Real specs are far shallower; defends against stack abuse |
| Operations per spec | 5,000 | Far above real APIs at 2 MB |
| Changes listed | 500 | Response bound; summary counts include all changes |
| Evidence value size | 1,000 chars | Response bound (worst case about 1.5 MB, versus Lambda's ~6 MB response limit) |

**Budget check (D-024, ≤ 20 s):** the local worst case is about 1.7 s for real specs and about 0.25 s for adversarial specs. That leaves a large margin for arm64 or a smaller CPU share on Bankr. **Phase 3 must confirm this on Bankr.** Memory observed on Bankr in T-001: a 128 MB allocation was fine (RSS about 193 MB); the local worst cases here use 156–208 MB, so **Phase 3 must also measure memory on Bankr**.

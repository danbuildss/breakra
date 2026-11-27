# Orric found it, we fixed it (D-050)

Running record for the "Orric found it, we fixed it" post. Each row: what Orric saw on a real public API, what
Breakra said before, what it says now, and where the fix landed. Verified with Orric's repro and a curated
benchmark case. The fixes ship together in npm 0.4.0 (rule set and engine 0.3.0); Orric then re-runs its
comparisons to confirm.

| # | Found on | Breakra before (0.3.1) | Breakra after | Fix |
|---|---|---|---|---|
| 14 | Outline `POST /documents.viewed`: `sort` went from any string to `updatedAt` / `createdAt` | **SAFE** (false safe: two "values added") | **REVIEW**: one `request.enum_introduced`, "callers sending other values may be rejected" | #69 |
| — | (mirror of #14, found while fixing it) a request enum dropped entirely | REVIEW (false alarm: "values removed") | SAFE: `request.enum_removed`, the field now accepts any value | #69 |
| 1 | Resend, Revolut, Oh Dear, Melissa (OpenAPI 3.1.2 specs) | refused (`UNSUPPORTED_OPENAPI_VERSION`) | accepted (3.1.0–3.1.2) | #69 |
| 3 | OpenAI: values inside `x-*` vendor extensions (975 in one diff) | REVIEW (unknown) | SAFE: documentation only | #70 |
| 4 | OpenAI: values inside `example` objects (62 in one diff) | REVIEW (unknown) | SAFE: documentation only | #70 |
| 2 | OpenAI `POST /images/*` `output_format`: inline enum inside `anyOf` moved to a shared enum that adds `gif`/`svg` | REVIEW ("png, jpeg removed", "default changed") | SAFE: `enum_value_added` | #70 |
| 16 | WorkOS `GET /events`: one path took 115 s to analyse (a 128 → 138-option `oneOf` whose options changed) | ~2 minutes, past the hosted 30 s cap | refused in under 0.1 s (`SPEC_TOO_COMPLEX`, "compare only the paths you use"); unions that only gain options, like GitHub's, still check normally | PR 3 |

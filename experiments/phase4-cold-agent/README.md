# Phase 4 cold-agent test (T-405)

`agent-client.ts` was written by a fresh agent that was given **only `skill.md`** (plus the installed `@x402/core`, `@x402/evm` and `viem` sources to learn the library APIs). It was not shown `examples/`, `src/` or any other docs. It is kept unchanged as evidence; it is not part of the product.

What happened:
- Against mock Bankr (Claude): 200 with an `analysis_id` identical to `examples/response.json`; an OpenAPI 2.0 input got a free 422.
- Gaps the agent reported in `skill.md` were fixed (expected `payTo`, `x402Version`, `maxTimeoutSeconds`, EIP-3009 vs Permit2, the exact 1 MB, what to do when a paid request dies in transit, how to retry `ANALYSIS_FAILED`, which library calls avoid auto re-signing, the `limitations` format).
- Live run: the owner runs it once ($0.02), see TESTING.md.

Run from the repo root (so the packages resolve):

```bash
bun -e 'const r = await Bun.file("examples/request.json").json(); await Bun.write(".cold-before.json", JSON.stringify(r.before)); await Bun.write(".cold-after.json", JSON.stringify(r.after))'
KEY_FILE=experiments/t001-bankr-probe/client/.burner-key bun experiments/phase4-cold-agent/agent-client.ts .cold-before.json .cold-after.json
```

Expected: exit code 2 (the example contains a breaking change), `Breakra verdict: BREAKING (sha256:39f62e04…2593)`.

## What and why

<!-- One topic per PR. Link the issue if there is one. -->

## Checklist

- [ ] `bun run check` passes
- [ ] Classification changes: test in `tests/rules.test.ts`, row in `RULES.md`, `RULE_SET_VERSION` bumped
- [ ] Behaviour or response-shape changes: `ENGINE_VERSION` bumped, `bun run examples` and `bun run demo` re-run
- [ ] No spec content in logs or error messages; no network access from the engine

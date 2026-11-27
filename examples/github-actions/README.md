# Breakra in GitHub Actions

## The official action (recommended)

[`breakra-action.yml`](breakra-action.yml) uses [`danbuildss/breakra-action`](https://github.com/danbuildss/breakra-action): one step, one pull-request comment with every change, its reason and fix, updated on each push, and a pass/fail check.

```yaml
- uses: danbuildss/breakra-action@v1.4.0
  with:
    spec: openapi.yaml
```

## A plain workflow (no action)

[`breakra.yml`](breakra.yml) fails a pull request when its OpenAPI contract may break callers. It runs the free npm CLI on the runner: no wallet, no account, and the contract never leaves the runner.

### Use it
1. Copy `breakra.yml` to `.github/workflows/breakra.yml` in your repository.
2. Set `SPEC` to your contract's path (OpenAPI 3.0/3.1, JSON or YAML), and the same path under `paths:`.
3. Choose `FAIL_ON`:
   - `block` (default): fail only on breaking changes, such as a removed operation.
   - `review`: also fail on potentially breaking changes and `unknown`s (a new required parameter, a removed response field…).

### What it does
- Compares the contract on the pull request with the same file on the base branch.
- Skips with a message when the contract is new on the branch (nothing to compare).
- Exit codes: `0` below `FAIL_ON`, `1` at or above it, `2` error. An error means unchecked, never "safe".
- The log shows the verdict, each finding, its reason and the recommended fix.

### Notes
- The version is pinned (`breakra@0.4.0`). Update it deliberately: a new rule set can change verdicts.
- Pull requests from forks work too: the workflow needs only `contents: read`.
- Several contracts? Duplicate the step with a different `SPEC`.

Tested: `tests/examples.test.ts` runs this workflow's script against real before/after contracts in a temporary git repository (breaking, compatible, new contract, `FAIL_ON: review`), and checks the pinned version matches the package.

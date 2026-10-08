# Demo: what changed in GitHub's REST API description, Dec 2025 → Oct 2026

A real contract change, run through Breakra. The inputs are six paths from GitHub's published OpenAPI description, plus the components they reference, at two releases of [`@octokit/openapi`](https://github.com/octokit/openapi) (MIT):

| | Package version | Published |
|---|---|---|
| `before.json` | 22.0.0 | 2025-12-09 |
| `after.json` | 24.0.0 | 2026-10-05 |

Paths: `/teams/{team_id}/discussions`, `/repos/{owner}/{repo}/tags/protection`, `/orgs/{org}/copilot/metrics`, `/repos/{owner}/{repo}/issues/{issue_number}/timeline`, `/orgs/{org}/teams/{team_slug}`, `/organizations/{org}/settings/billing/budgets/{budget_id}`. The request body is 251 KB. Regenerate everything with `bun run demo`.

## Result

`compatibility: "breaking"`, `analysis_id: sha256:c17639a1f47c0d48a1dec9faac4eaf8b0f2a0ecd94dab6867a65872453faddc1` (engine 0.1.1, rule set 0.1.0). Full output: [`response.json`](response.json).

| Class | Count |
|---|---|
| `breaking` | 5 |
| `potentially_breaking` | 35 |
| `compatible` | 10 |
| `non_contract` | 9 |

### Breaking: operations no longer in the description

- `GET` and `POST /teams/{team_id}/discussions` (team discussions)
- `GET` and `POST /repos/{owner}/{repo}/tags/protection` (tag protection)
- `GET /orgs/{org}/copilot/metrics`

Breakra reports what the contract says. An operation missing from the newer description means code generated from it, or written against it, has nothing to call; whether GitHub's servers still answer the old route is outside what a contract diff can tell you.

### Potentially breaking: what an integration should review

- **Issue timeline** (`GET …/issues/{issue_number}/timeline`): 13 new event schemas in the response's `anyOf` (`issue-type-added-issue-event`, `sub-issue-added-issue-event`, `blocked-by-added-issue-event`, `parent-issue-added-issue-event`, `timeline-connected-event`, …). Code with an exhaustive switch over timeline events will meet values it doesn't handle.
- **Billing budgets** (`…/settings/billing/budgets/{budget_id}`):
  - `GET`: `budget_scope` gained the values `user`, `multi_user_customer` and `multi_user_cost_center`; `budget_type` gained a new variant.
  - `PATCH` request: `budget_type`, `budget_scope`, `budget_entity_name` and `budget_product_sku` are no longer in the request schema. Callers that still send them may be rejected or ignored.
  - `PATCH` response: the schema root no longer declares `type: object`, and its properties widened.
- **Teams** (`GET`/`PATCH /orgs/{org}/teams/{team_slug}`): `organization.blog`, `company`, `email` and `location` can now be `null`. Code that assumes strings needs null checks.

### Compatible (selected)

A new optional `exclude` query parameter on the timeline; `consumed_amount` and `user` added to budget responses; `expires_at` accepted on budget updates; `parent_team_slug` accepted on team updates.

## How a coding agent uses this

1. Before upgrading a GitHub client or regenerating an SDK, send the old and new descriptions (or the slices you call) to Breakra.
2. Gate on `compatibility`: here it is `breaking`, so stop and review.
3. For each `breaking` and `potentially_breaking` finding, search the codebase for the `operation` (method + path) and `location.field`, and apply `recommended_action`.
4. Keep `analysis_id` with the change: the same inputs always produce the same id and findings.

## Limits shown here

- Only six paths. The full GitHub description (about 13 MB) is far over Breakra's 1 MB limit; compare the paths you use.
- Findings are about the contract, not runtime behaviour.
- GitHub's API description: © GitHub, distributed by [`github/rest-api-description`](https://github.com/github/rest-api-description) and `@octokit/openapi` under the MIT license.

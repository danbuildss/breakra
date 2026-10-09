# X drafts (owner's account)

Rules: facts only, no "AI-powered", no invented users or numbers, no attribution to Somehow. Each claim below is checkable in the repo.

## Post 1 — launch (day 1)

Attach **`docs/assets/x-launch.png`** (1600×900).

> Breakra tells a coding agent whether an OpenAPI change breaks its integration.
>
> Send the old + new contract → every change labelled breaking / potentially breaking / compatible, with evidence and a fix.
>
> $0.02 USDC on Base via x402. Errors are free.
>
> breakra.dev

Reply under it:

> How an agent uses it: read breakra.dev/skill.md, POST {before, after}, pay once, gate on `compatibility`, fix each finding.
>
> Same inputs → same analysis_id.
>
> Open source (MIT): github.com/danbuildss/breakra
>
> Feedback welcome, especially wrong findings.

## Post 2 — real demo (day 2–4)

> What changed in GitHub's REST API description between Dec 2025 and Oct 2026? Ran six paths through Breakra:
>
> • 5 operations gone from the contract: team discussions, tag protection, Copilot org metrics
> • 13 new issue-timeline event types (exhaustive switches beware)
> • billing budget fields dropped from PATCH, new enum values in GET
> • team org fields now nullable
>
> Full output + inputs: github.com/danbuildss/breakra/tree/main/demo/github-rest-api

## Replies you may need

- *"Why pay, oasdiff is free?"* → "oasdiff is great if you can run a Go binary. Breakra is one HTTP call an agent can make from anywhere, with a recommended action per finding and the same rules every time. $0.02, and nothing to install."
- *"Do you store my spec?"* → "No. Breakra doesn't store or log submitted contracts; logs hold only outcome, size, change count, duration and the paying wallet. Requests do pass through Bankr's x402 hosting."
- *"OpenAPI 3.1 / YAML?"* → "Not yet. That's exactly the kind of feedback I'm collecting this month."

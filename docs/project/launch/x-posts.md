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

Attach **`docs/assets/x-demo.png`** (1600×900). Post it as a **new post** (not a reply), 1–3 days after post 1.

> GitHub's REST API, Dec 2025 → Oct 2026. Six paths through Breakra:
>
> • 5 operations removed (team discussions, tag protection, Copilot metrics)
> • 13 new issue-timeline event types
> • budget fields dropped from PATCH
> • team org fields now nullable
>
> breakra.dev

Reply under it:

> Inputs, full output and write-up: github.com/danbuildss/breakra/tree/main/demo/github-rest-api

## Replies you may need

- *"Why pay, oasdiff is free?"* → "oasdiff is great if you can run a Go binary. Breakra is one HTTP call an agent can make from anywhere, with a recommended action per finding and the same rules every time. $0.02, and nothing to install."
- *"Do you store my spec?"* → "No. Breakra doesn't store or log submitted contracts; logs hold only outcome, size, change count, duration and the paying wallet. Requests do pass through Bankr's x402 hosting."
- *"OpenAPI 3.1 / YAML?"* → "Not yet. That's exactly the kind of feedback I'm collecting this month."

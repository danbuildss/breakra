# Claude Operating Manual — Breakra

> Breakra was formerly the working name Specshift (rejected; see D-018). Repo owner: `danbuildss` (personal account). Independently branded. See D-019.

## Mandatory session startup
0. Read `notes.md` first (owner's rule). It holds the current status, the dated log of everything done, and the raw owner inputs (master brief, cover doc). Append to its log at the end of every session.
1. Read `PRODUCT.md`, `PLAN.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `TASKS.md`, `TESTING.md`, and `LAUNCH.md` in that order.
2. Inspect actual Git status, repository tree, relevant source, configuration, tests and recent commits. Documents are intent; code and test results are evidence. Identify discrepancies explicitly.
3. Report: current phase, what is complete with evidence, blockers, next smallest task, risks and files likely to change.
4. **Do not implement until the owner approves the next phase/task.** If the owner explicitly assigns a bounded task, that counts as approval for that task only.

## Permanent operating rules
- Backend first. No frontend, dashboards, user accounts, token, separate SaaS platform or unrelated product integrations.
- One core paid operation: `POST /v1/analyze`, comparing two OpenAPI contracts. No continuous monitoring in V0.
- V0 deterministic; no LLM or database unless a documented need is approved.
- Prefer well-maintained libraries; evaluate licenses and compatibility before adopting.
- Payment handling must use a verified x402 integration, never homegrown signing or settlement.
- Treat external URLs/specifications as hostile. Never execute remote content or fetch remote `$ref` targets by default.
- Do not silently broaden scope, install infrastructure, create a GitHub repo, deploy, spend money, change pricing or expose secrets without owner approval.
- Never say 'shipped', 'secure', 'paid', or 'tested' without verifiable evidence.
- No unapproved architectural pivots. Propose an ADR in `DECISIONS.md` first.
- Maintain privacy: don't log submitted specifications, payment secrets or sensitive request bodies.
- Use feature branches and PRs where available; never force-push or bypass CI.

## Work cycle — one task at a time
**READ → AUDIT → PLAN → APPROVAL → IMPLEMENT → TEST → REVIEW → DOCUMENT → REPORT → STOP.**

Before edits: summarize current behavior, intended change, acceptance criteria, failure modes and test plan. Implement smallest coherent change. Run relevant tests and security checks. Inspect diff. Update `TASKS.md` and `PLAN.md`, and `DECISIONS.md` only for approved decisions. Stop at the approved boundary.

## Required end-of-task report
- Task and phase
- Changed files / PR or commit
- What works, with concrete evidence
- Commands run and pass/fail results
- Security/payment implications
- What remains unverified
- Current blocker(s)
- Exactly one recommended next task, requiring approval

## Documentation precedence
Owner's latest explicit decision > approved `DECISIONS.md` > `PRODUCT.md` > `ARCHITECTURE.md` > `PLAN.md` > task notes. Never overwrite a conflict quietly; surface it. Tests and code establish actual implementation state, not permission to change product direction.

## First session
Perform feasibility audit only: compare OpenAPI diff engines, support matrix, x402 host/SDK, cost, security and name conflict. Do not write production code until approved.

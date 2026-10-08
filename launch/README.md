# Phase 5 launch kit (drafts for the owner)

Everything here is a **draft**. Only the owner posts or submits (D-033). **Nothing is published before the Breakra domain and trademark check is clear.**

## Before day 1
1. Merge the Phase 5 PR, redeploy (engine 0.1.1, `SKILL.md` link in the listing), then run `bun scripts/verify-live.ts V0` and the demo check in `../demo/github-rest-api/` (see the PR).
2. Domain and trademark check: clear.
3. GitHub repo settings (see `github.md`): description, website, topics.

## Day 1 (in this order)
| # | Channel | File | Notes |
|---|---|---|---|
| 1 | GitHub | `github.md` | About box and topics. Free, instant |
| 2 | X | `x-posts.md` post 1 (+ optional thread) | From the owner's account |
| 3 | Bankr skills catalog | `directories.md` §1 | PR to `BankrBot/skills` |
| 4 | x402scan | `directories.md` §2 | Web form, single URL |
| 5 | awesome-x402 | `directories.md` §3 | PR, one line |

## Days 2–14
- Post the demo (`x-posts.md` post 2) on a later day, not the same day.
- Reply to questions with facts from `../SKILL.md` and `../RULES.md`. Don't promise features.
- Every 1–3 days: `bun run metrics` and `bankr x402 revenue breakra-analyze`, paste both to Claude.
- Log every post with its link in `../EXPERIMENT.md` (Distribution log).

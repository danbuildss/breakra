# Breakra website v2 and partner-readiness plan (owner input, 2026-11-20)

**Status:** plan saved at the owner's request. Not approved for implementation. The order is **PR D (benchmark) first, then website v2**, as agreed 2026-11-20.

**References the owner chose:**
- **1claw.co** is the primary model. The owner "loves everything about it" and wants its header (mega-menus) and footer.
- ratspeak.org and aeon.fun are secondary.

**Rule:** copy patterns and structure, never their code, CSS, copy or logos. 1Claw's licences weren't confirmed. No "used by" logo walls, no tokens, no invented numbers.

---

## 1. What the references do (read 2026-11-20 by downloading the pages)
- **1claw.co:**
  - A one-line promise.
  - "Fastest start: `npx @1claw/cli setup`" in the hero.
  - A live demo widget, a before/after section, and "Built for every agent stack" use-case cards.
  - A "For AI" menu (llms.txt, SKILL.md, MCP config).
  - Ecosystem, Compare, Pricing, Docs, Status, Blog and Contact (partnerships) pages.
  - A three-menu header (screenshots from the owner):
    - **Platform:** product list, an icon plus a one-line description per item.
    - **Developers:** MCP Server, Docs, For AI, Ecosystem, SDKs/OpenAPI/CLI, Agent Directory…
    - **More:** Blog, Academy, Compare, Research, Webinar, Demo, Status, About, Contact.
- **ratspeak.org:** a short headline, "See it work ↓", an interactive "take things away" explainer, and a device-picker grid.
- **aeon.fun:** a copy box with "read aeon.fun/skills/aeon.md" (agent-native onboarding), "Works with Claude Code, Codex…", a skills catalog and a blog.

## 2. Header: Breakra's version of the 1Claw mega-menu
Static HTML/CSS (a `<details>`-style menu, works without JavaScript; a tiny self-hosted script only for closing menus), keyboard-accessible, CSP-safe.

| Menu | Items (icon + one-line description) | Exists today? |
|---|---|---|
| **Product ▾** | **CLI**: check two contracts in one command · **MCP Server**: `check_openapi_change` for Claude Code and any MCP client · **Hosted API**: $0.02/check via x402, no account · **GitHub Action**: *roadmap* · **Impact**: *research* (labelled, never implied as shipped) | CLI, MCP, API yes; the others are labelled |
| **Developers ▾** | **Docs**: quickstart, API reference · **For AI**: `skill.md`, `llms.txt`, MCP config · **Integrations**: Claude Code, Cursor, CI, x402 agents · **OpenAPI spec** · **Rules**: every classification rule · **Changelog** · **GitHub** | Mostly yes (docs live in GitHub today) |
| **Pricing** | Free (local) · Hosted $0.02 · Teams (talk to us) | New page |
| **More ▾** | **Benchmark**: real API changes, measured · **Blog** · **Compare**: Breakra vs alternatives, honestly · **Security**: privacy, scans, disclosure · **Status**: hosted API health · **About** · **Contact**: support, partnerships | New pages |

Right side of the header: a GitHub link (optionally a star count fetched at build time, no runtime calls), a **"Get started"** button (→ quickstart), and a theme toggle (dark is the brand default; light optional).

## 3. Footer (1Claw-style columns)
- **Product:** CLI · MCP Server · Hosted API · Pricing
- **Developers:** Docs · For AI (skill.md, llms.txt) · OpenAPI · Rules · Changelog · GitHub
- **Resources:** Benchmark · Blog · Compare · Security · Status
- **Company:** About · Contact / partnerships · Brand kit
- **"Listed on"** row, real links only: npm · MCP Registry · Glama · Tessl · skills.sh · x402scan · Bankr
- **Bottom row:** "Built by SOMEHOW" (D-019 amendment, kept) · MIT · © Breakra

## 4. Homepage sections
1. **Hero:**
   - "Know what breaks before your agent ships."
   - Two copy boxes: `npx -y breakra check old.yaml new.yaml` and "Give your agent: read breakra.dev/skill.md".
   - "Works with Claude Code and any MCP client."
2. **See it work:** tabs with real, precomputed examples (endpoint removed, required parameter added, response field removed, 3.1 null type, docs-only) showing the verdict and fix. Generated from the engine at build; a test keeps them identical.
3. **Before / after:** "agent merges, clients break" vs "`block` + exact fix before merge".
4. **Built for every agent stack:** coding agents, SDK/integration maintainers, API platform teams, x402 agents.
5. **Trust:** the "Listed on" strip; facts only (MIT, deterministic, test count, oasdiff cross-check, security-scanned).
6. **For AI agents:** `skill.md`, `openapi.json`, `/llms.txt`, MCP config.
7. **Pricing** teaser.
8. **FAQ.**

## 5. New pages
`/integrations`, `/compare`, `/pricing`, `/security`, `/benchmark` (from PR D), `/blog` (or changelog), `/about`, `/contact`, `/brand`, `/llms.txt`. Optionally `/status`: a static page plus GitHub-Actions-run checks; no third-party script.

## 6. Ideas from 1Claw's GitHub and product for Breakra's roadmap
| 1Claw has | Breakra equivalent | Priority |
|---|---|---|
| `@1claw/cli`, `npx … setup` | `npx -y breakra` | ✅ shipped |
| `@1claw/mcp` (also on Glama, claudemarket) | `breakra mcp` on npm, MCP Registry, Glama | ✅ shipped |
| `1claw-examples` (23 example apps) | **`examples/` expansion or a `breakra-examples` repo:** GitHub Actions CI recipe, Claude Code, Cursor, a pre-commit hook, an x402 paying agent, a Node script using `--json` | **High**: cheap, partner-friendly, drives adoption |
| A docs site (1claw-docs) | **breakra.dev/docs:** quickstart, CLI reference, MCP, API, rules, integrations (static) | **High** (with website v2) |
| TypeScript SDK (`@1claw/sdk`) + Go SDK | **`breakra` as a library:** export `analyze()` from the npm package (typed result) so tools and partners embed the engine without shelling out. A Go/Python SDK only on demand | **Medium**: strong for partners; small change |
| Agent-framework plugins and skills (OpenClaw plugin, ClawHub skill) | **Breakra skill/plugin listings:** Claude Code plugin marketplace, ClawHub/OpenClaw, aeon's skill catalog, Cursor rules | **Medium**: distribution |
| Homebrew install | `brew install breakra` via a tap | Low (npx covers it) |
| llms.txt, "For AI" menu | `/llms.txt` + a "For AI" menu item | **High**, trivial |
| Status page | Static status from scheduled checks (402 terms, site paths) | Low/medium |
| Compare / Research / Academy / Webinar | Compare page; the **Benchmark** as our "research"; skip academy and webinars for now | Compare: medium |
| Agent Directory, Embedded Wallets, Runtimes, Intents | Not our product; **don't copy** | — |

## 7. Partner-readiness checklist
1. **Proof:** a public benchmark (PR D).
2. **Stable contract:** versioned JSON output (`openapi.json`, rule IDs, `analysis_id`), stated on /integrations.
3. **Embeddable:** npm CLI/MCP ✅, hosted API ✅, library export (§6), GitHub Action (roadmap).
4. **Security page:** privacy, scan results and fixes, SECURITY.md.
5. **Brand kit:** logo, colours, one-paragraph description, screenshots.
6. **Contact for partnerships:** mailto only (no forms or trackers).
7. **Partner types:** agent frameworks and skill catalogs · x402 marketplaces (Circle, Bankr, BlockRun) · code-review / agent-quality tools · complementary agent-security tools (1Claw protects keys; Breakra protects contracts).

## 8. Constraints that still apply
- **Static site on Vercel, strict CSP:** no external scripts, fonts or images; no analytics or trackers; no forms. The demo is precomputed, not a live engine in the browser. This stays within D-037 (informational site) and D-039 (no web app UI). A live in-browser engine would need a new decision.
- **Every claim checkable;** roadmap items labelled as such.
- **Previews (desktop + mobile)** are shown to the owner before any merge.

## 9. Proposed order (needs approval at each step)
1. **PR D:** benchmark (numbers and examples for the site and partners).
2. **Website v2, part 1:** new header (mega-menus), footer, homepage sections 1–8, `/llms.txt`.
3. **Website v2, part 2:** `/integrations`, `/compare`, `/pricing`, `/security`, `/benchmark`, `/blog`, `/about`, `/contact`, `/brand`.
4. **Developer assets:** examples expansion (CI recipe first), library export of `analyze()`.
5. **Distribution:** agent-framework skill/plugin listings.

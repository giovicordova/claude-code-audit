@VISION.md

# Project

CC Audit is a Claude Code skill. The entire product is `skills/cc-audit/SKILL.md`.
No code, no build, no tests. Everything is markdown.

# Architecture

- `skills/cc-audit/SKILL.md` — the skill users run with `/cc-audit`
- `skills/cc-audit/references/` — bundled reference docs loaded on-demand during audit (progressive disclosure level 3)
- `VISION.md` — product vision (imported above)
- `README.md` — installation and usage for end users
- `.claude-plugin/plugin.json` — plugin manifest for distribution
- `.claude-plugin/marketplace.json` — marketplace registration

# Constraints

- SKILL.md must preserve all 5 phases (Verify Dependencies, Understand Project, Confirm with User, Audit, Write Report)
- SKILL.md must preserve all 9 audit areas (4.1 CLAUDE.md through 4.9 Rules)
- SKILL.md must stay under 500 lines
- SKILL.md frontmatter fields (`disable-model-invocation: true`, `allowed-tools`) must not change without deliberate reason
- Every audit area must have: Scan targets, Fetch docs references, Evaluate checklist
- Report template in Phase 5 must stay in sync with audit areas

# Workflow

- Commit format: `type: description` (e.g., `feat:`, `fix:`, `docs:`, `improve:`)
- Testing: install skill globally, run `/cc-audit` against a test project, verify report output
- Changes to SKILL.md: read the full file first, understand all 5 phases, then make targeted edits

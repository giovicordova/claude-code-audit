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

# Workflow

- Commit format: `type: description` (e.g., `feat:`, `fix:`, `docs:`, `improve:`)
- Testing: install skill globally, run `/cc-audit` against a test project, verify report output
- Changes to SKILL.md: read the full file first, understand all 5 phases, then make targeted edits

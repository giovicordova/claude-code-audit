@VISION.md

# Project

CC Audit is a Claude Code skill. The repo root IS the skill directory.
No code, no build, no tests — everything is markdown.

# Architecture

- `SKILL.md` — the orchestrator skill users run with `/cc-audit`
- `agents/` — specialist instruction files for Phase 4 audit domains (instructions, components, automation, integration, adversarial reviewer)
- `references/` — bundled reference docs loaded on-demand during audit (progressive disclosure level 3)

# Workflow

- Commit format: `type: description` (e.g., `feat:`, `fix:`, `docs:`, `improve:`)
- Testing: install skill globally, run `/cc-audit` against a test project, verify report output

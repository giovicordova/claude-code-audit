# Vision

CC Audit checks your project's Claude Code setup against the official documentation. Run `/cc-audit`, get a report: what's solid, what could improve, what needs fixing. Every recommendation is backed by official documentation and filtered through what your project actually needs.

## How It Works

1. **Reads your project.** Scans your docs (README, CLAUDE.md, etc.) to understand your project's goal. Maps the `.claude/` directory to see what's already configured.

2. **Confirms with you.** Presents its understanding of your project. You confirm or correct. Nothing moves forward until the goal is locked in.

3. **Audits.** Pulls the latest official docs at runtime, compares them against your current setup, and evaluates everything through the lens of your project's goal. If a recommendation doesn't serve your project, it stays out.

4. **Writes the report.** Drops `AUDIT-REPORT.md` in your project root. Each finding is tagged **good**, **improve**, or **fix** — with what's there now, what to change, why it matters for your project, and a link to the backing documentation. Ends with prioritized actions and instructions for implementing them.

## Why It Works

No hardcoded checklists. It pulls the current official docs every time it runs, so recommendations stay accurate as Claude Code evolves. Every suggestion has two anchors: proof from the docs, and a reason tied to your project's goal.

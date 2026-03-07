# Vision

CC Audit is a Claude Code skill that audits any project's Claude Code setup against the official Anthropic documentation. You run `/cc-audit`, and it produces a structured report telling you what's working, what could be better, and what needs fixing — with every recommendation backed by the official docs and filtered through your project's actual goal.

## How It Works

The skill runs in a forked context, keeping the main conversation clean. It works in four phases.

First, it reads the project. It scans README files, CLAUDE.md, VISION.md, package.json, and any other descriptive files to understand what the project is trying to achieve. It also maps the `.claude/` directory to see what Claude Code setup already exists — skills, sub-agents, hooks, MCP configurations, permissions, settings, rules.

Second, it confirms its understanding with the user. It presents a summary: "From my analysis, this project is about X. Is this accurate, or do you have additional documentation I should review?" The user confirms, corrects, or points to more context. Nothing proceeds until the goal is locked in.

Third, it audits. For each area of the Claude Code setup, it fetches the relevant official documentation page through the Anthropic Documentation MCP, reads what currently exists in the project, and evaluates the current state against the docs — always through the lens of the project's goal. A recommendation only makes it into the report if it's proven by the documentation AND it serves the project's purpose. Suggestions that would add complexity without clear benefit are left out.

Fourth, it writes the report. `AUDIT-REPORT.md` lands in the project root with findings organized by area. Each finding is tagged as **good** (keep this), **improve** (works but could be better), or **fix** (against best practices). Every finding includes what's there now, what the recommendation is, why it matters for this specific project, and a link to the Anthropic documentation that backs it. The report ends with priority actions ranked by impact and a section explaining how to feed the report into a new Claude Code Plan mode session to implement the changes.

## What It Audits

- **CLAUDE.md** — structure, length, content quality, what belongs and what doesn't
- **Skills** — frontmatter, naming, descriptions, supporting files, invocation control, whether a skill is the right tool for the job
- **Sub-agents** — tool restrictions, model selection, descriptions, whether a sub-agent should be used instead of a skill or vice versa
- **Hooks** — event handling, matchers, command structure
- **MCP** — server configurations and usage
- **Permissions** — allowlists, sandbox settings
- **Settings** — general configuration and scope
- **Project structure** — `.claude/` directory organization, rules, proper layering of features

## What Makes It Different

The audit never improvises. It fetches the current official documentation at runtime through the Anthropic Documentation MCP, so recommendations stay accurate as Claude Code evolves. There are no hardcoded checklists that go stale. Every suggestion has two anchors: proof from the official docs, and a reason tied to the project's goal. If a best practice exists in the docs but doesn't serve the project, it stays out of the report.

## How to Use It

Install the skill globally at `~/.claude/skills/cc-audit/`. It requires the Anthropic Documentation MCP to be configured. Run `/cc-audit` from any project. Read the report. Feed it into a Plan mode session to implement the recommendations.

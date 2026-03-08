# CC Audit

A Claude Code skill that audits any project's Claude Code setup against the official Anthropic documentation.

Run `/cc-audit` in any project. Get a structured report telling you what's working, what could be better, and what needs fixing — every recommendation backed by the docs and filtered through your project's actual goal.

## Requirements

- [Claude Code](https://claude.ai/download) installed and authenticated
- [Anthropic Documentation MCP](https://github.com/giovicordova/anthropic-docs) configured

## Installation

### 1. Set up the Anthropic Documentation MCP

```bash
claude mcp add anthropic-docs -- npx -y @anthropic-ai/anthropic-docs-mcp
```

### 2. Install the skill

#### Option A: Plugin install (recommended)

Add the marketplace and install:

```
/plugin marketplace add giovicordova/claude-code-audit
/plugin install cc-audit@cc-audit-marketplace
```

#### Option B: Manual install

Clone this repository and copy the skill to your global skills directory:

```bash
git clone https://github.com/giovicordova/claude-code-audit.git
mkdir -p ~/.claude/skills
cp -r claude-code-audit/skills/cc-audit ~/.claude/skills/cc-audit
```

Or create a symlink to stay updated with git pull:

```bash
git clone https://github.com/giovicordova/claude-code-audit.git
mkdir -p ~/.claude/skills
ln -s "$(pwd)/claude-code-audit/skills/cc-audit" ~/.claude/skills/cc-audit
```

### 3. Verify

Open Claude Code in any project and type `/cc-audit`. The skill should appear in autocomplete. Plugin installs use `/cc-audit:cc-audit`, manual installs use `/cc-audit` — autocomplete handles either.

## Usage

```
/cc-audit
```

The skill:

1. **Reads the project** — scans README, CLAUDE.md, package.json, and other files to understand the project's goal
2. **Confirms with you** — presents its understanding and asks if it's accurate before proceeding
3. **Audits against the docs** — fetches official Anthropic documentation for each area and compares your setup
4. **Writes the report** — produces `AUDIT-REPORT.md` in the project root

## What It Audits

| Area | What it checks |
|------|---------------|
| CLAUDE.md | Structure, length, content quality, proper use |
| Skills | Frontmatter, descriptions, invocation control, right tool for the job |
| Sub-agents | Tool restrictions, model selection, when to use vs skills |
| Hooks | Event handling, matchers, deterministic automation |
| MCP | Server configurations, scope, usage |
| Permissions | Allowlists, deny rules, sandboxing |
| Settings | Scope, configuration |
| Feature Selection | Right feature for the right job, missing opportunities |
| Rules | Path scoping, organization, overlap with CLAUDE.md |

## Report Format

Each finding in the report is tagged:

- **good** — keep this, it follows best practices
- **improve** — works but could be better
- **fix** — against best practices

Every finding includes:
- What exists now
- What to change (for improve/fix)
- Why it matters for your specific project
- Link to the Anthropic documentation that backs it

## After the Audit

Feed the report into a Plan mode session to implement the recommendations:

1. Start a new Claude Code session
2. Enter Plan mode (Shift+Tab)
3. Say: "Read AUDIT-REPORT.md and create an implementation plan for the recommendations"
4. Review the plan, then switch to Normal mode to execute

## How It Works

The skill fetches the current official documentation at runtime through the Anthropic Documentation MCP. There are no hardcoded checklists. Recommendations stay accurate as Claude Code evolves.

## License

MIT

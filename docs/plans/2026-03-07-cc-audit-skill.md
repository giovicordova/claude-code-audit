# CC Audit Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a global Claude Code skill (`/cc-audit`) that audits any project's Claude Code setup against official Anthropic documentation and writes a structured report.

**Architecture:** Single SKILL.md file installed at `~/.claude/skills/cc-audit/`. Runs in a forked context (`context: fork`) using the default general-purpose agent. Fetches official docs at runtime via the Anthropic Documentation MCP — no hardcoded checklists. Produces `AUDIT-REPORT.md` in the target project root.

**Tech Stack:** Pure markdown (SKILL.md with YAML frontmatter). No code, no dependencies beyond Claude Code and the anthropic-docs MCP.

---

### Task 1: Initialize Git Repository

**Files:**
- Create: `.gitignore`

**Step 1: Initialize git**

Run:
```bash
cd /Users/giovannicordova/Documents/02_projects/claude-code-audit-tool && git init
```

**Step 2: Create .gitignore**

Create `.gitignore`:
```
.DS_Store
*.swp
*.swo
*~
.claude/settings.local.json
CLAUDE.local.md
```

**Step 3: Stage and commit**

```bash
git add .gitignore VISION.md CLAUDE.md STATE.md
git commit -m "feat: initialize cc-audit project with vision doc

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create the SKILL.md File

This is the core deliverable. The entire skill is this one file.

**Files:**
- Create: `skills/cc-audit/SKILL.md`

**Step 1: Create the skill directory**

```bash
mkdir -p /Users/giovannicordova/Documents/02_projects/claude-code-audit-tool/skills/cc-audit
```

**Step 2: Write SKILL.md**

Create `skills/cc-audit/SKILL.md` with the exact content below. This file is the complete prompt for the forked agent. Every instruction matters — do not paraphrase, summarize, or reorder.

```markdown
---
name: cc-audit
description: Audit a project's Claude Code setup against official Anthropic documentation. Evaluates CLAUDE.md, skills, sub-agents, hooks, MCP, permissions, settings, and project structure. Produces AUDIT-REPORT.md.
disable-model-invocation: true
context: fork
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, mcp__anthropic-docs__search_anthropic_docs, mcp__anthropic-docs__get_doc_page, mcp__anthropic-docs__list_doc_sections, mcp__anthropic-docs__index_status
---

# Claude Code Audit

You are auditing a project's Claude Code setup against the official Anthropic documentation. Follow each phase in order. Every recommendation must have two anchors: proof from the official docs, and a reason tied to the project's goal. If a best practice exists in the docs but does not serve the project, leave it out of the report.

## Phase 1: Verify Dependencies

Call `mcp__anthropic-docs__index_status` to confirm the Anthropic Documentation MCP is available.

If the call fails, use AskUserQuestion to tell the user:

"The CC Audit skill requires the Anthropic Documentation MCP. To set it up:
1. Run: `claude mcp add anthropic-docs -- npx -y @anthropic-ai/anthropic-docs-mcp`
2. Restart Claude Code
3. Run `/cc-audit` again

See https://github.com/anthropics/anthropic-docs-mcp for details."

Then stop. Do not continue the audit.

## Phase 2: Understand the Project

### Step 1: Find descriptive files

Use Glob to search for these patterns in the project root:
- `README*`
- `VISION*`
- `CLAUDE.md`
- `.claude/CLAUDE.md`
- `package.json`
- `pyproject.toml`
- `Cargo.toml`
- `go.mod`
- `docs/**/*.md` (first 5 results only)

### Step 2: Read what you found

Read each file from Step 1. For package manifests (package.json, pyproject.toml, etc.), focus on name, description, and dependencies.

### Step 3: Map the Claude Code setup

Use Glob to find everything under `.claude/` and any root-level CLAUDE.md or CLAUDE.local.md files. This tells you what features are currently configured.

### Step 4: Form your understanding

Write down:
- What the project is (1-2 sentences)
- What it is trying to achieve (1-2 sentences)
- What Claude Code features are currently in use

## Phase 3: Confirm with User

Use AskUserQuestion with this message:

"**CC Audit — Project Understanding**

From my analysis, this project is [your understanding]. The goal is [your understanding of the goal].

Claude Code features currently in use: [list what you found]

Is this accurate, or do you have additional documentation I should review?"

Wait for the user's response. If they correct you or point to more files, read those files and update your understanding. Do not proceed until confirmed.

## Phase 4: Audit

For each area below:
1. Read what currently exists in the project for this area
2. Fetch the relevant official doc page using `mcp__anthropic-docs__get_doc_page`
3. Compare the current state against the documentation
4. Filter through the project's confirmed goal — only include findings that matter for this project
5. Tag each finding: **good** (keep this), **improve** (works but suboptimal), **fix** (against best practices)
6. Record the doc source URL

### 4.1 CLAUDE.md

**Scan:** `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`, CLAUDE.md files in subdirectories

**Fetch docs:**
- `/docs/en/memory`
- `/docs/en/best-practices`

**Evaluate:**
- Does it exist? Should it for this project?
- Length: under 200 lines as recommended?
- Content: includes things Claude cannot infer from code?
- Content: avoids what the docs say to exclude (file-by-file descriptions, standard conventions, long tutorials)?
- Structure: uses headers and bullets for scanability?
- Specificity: instructions are concrete and verifiable?
- Imports: uses @path syntax for additional context where useful?
- Is any content better suited as a skill, rule, or hook?

### 4.2 Skills

**Scan:** `.claude/skills/`, `.claude/commands/`

**Fetch docs:**
- `/docs/en/skills`

**Evaluate:**
- Proper YAML frontmatter (name, description)?
- Descriptions clear enough for Claude to know when to use them?
- `disable-model-invocation` set correctly for side-effect workflows?
- `user-invocable` set correctly?
- `allowed-tools` specified where appropriate?
- Content under 500 lines? Should supporting files exist?
- Instructions in CLAUDE.md that belong as skills instead?
- Any skill that should use `context: fork`?
- Arguments handled properly with $ARGUMENTS?

### 4.3 Sub-agents

**Scan:** `.claude/agents/`

**Fetch docs:**
- `/docs/en/sub-agents`

**Evaluate:**
- Required `name` and `description` fields present?
- Tool restrictions appropriate?
- Model selection justified?
- Skills that should be sub-agents (need context isolation)?
- Sub-agents that should be skills (don't need isolation)?
- `permissionMode` set appropriately?
- Could any benefit from persistent memory?

### 4.4 Hooks

**Scan:** `.claude/settings.json` (hooks section), `.claude/settings.local.json`

**Fetch docs:**
- `/docs/en/hooks-guide`

**Evaluate:**
- Used for things that must happen deterministically?
- Matchers specific enough?
- CLAUDE.md instructions that should be hooks instead?
- Hook scripts executable and properly referenced?

### 4.5 MCP

**Scan:** `.mcp.json`, `.claude/.mcp.json`

**Fetch docs:**
- `/docs/en/mcp`

**Evaluate:**
- Servers configured at the right scope?
- External services the project uses that could benefit from MCP?
- Tool search configured for servers with many tools?

### 4.6 Permissions

**Scan:** `.claude/settings.json` (permissions section), `.claude/settings.local.json`

**Fetch docs:**
- `/docs/en/permissions`

**Evaluate:**
- Safe commands allowlisted to reduce interruptions?
- Deny rules for dangerous operations?
- Sandboxing configured for appropriate use cases?

### 4.7 Settings

**Scan:** `.claude/settings.json`, `.claude/settings.local.json`

**Fetch docs:**
- `/docs/en/settings`

**Evaluate:**
- Settings at the right scope (project vs local vs user)?
- Anything misconfigured or using deprecated options?

### 4.8 Feature Selection

**Fetch docs:**
- `/docs/en/features-overview`

**Evaluate:**
- Is each feature being used for what it is best at?
- Features being misused (skill where a hook fits better, or vice versa)?
- Missing features that would serve the project's goal?
- Overall setup light and efficient, or overengineered?

## Phase 5: Write Report

Write `AUDIT-REPORT.md` in the project root using this exact structure:

```
# Claude Code Audit Report

> Generated on [today's date]

## Project Understanding

[Confirmed project goal from Phase 3]

## Current State

| Area | Status |
|------|--------|
| CLAUDE.md | [Exists / Missing] |
| Skills | [X found / None] |
| Sub-agents | [X found / None] |
| Hooks | [Configured / Not configured] |
| MCP | [X servers / Not configured] |
| Permissions | [Configured / Default] |
| Settings | [Configured / Default] |
| Rules | [X found / None] |

## Findings

[For each area that has findings, use this format:]

### [Area Name]

#### [good/improve/fix] Finding title

- **Current**: What exists now
- **Recommendation**: What should change (omit for "good" findings)
- **Project relevance**: Why this matters for this specific project
- **Source**: [Doc section title](full URL)

[Repeat for each finding. Group by area. Skip areas with no findings.]

## Priority Actions

[Top findings ranked by impact. Only include "improve" and "fix" items.]

1. **[fix]** [Brief description] — [why it is high priority for this project]
2. **[improve]** [Brief description] — [why it matters]
3. ...

## Next Steps

To implement these recommendations:

1. Start a new Claude Code session
2. Enter Plan mode (Shift+Tab)
3. Share this report: "Read AUDIT-REPORT.md and create an implementation plan for the recommendations"
4. Review the plan, then switch to Normal mode to execute
```

After writing the report, output this summary to the conversation:

"Audit complete. Report written to AUDIT-REPORT.md.

Found [X] findings: [Y] good, [Z] to improve, [W] to fix.

Top priorities:
1. ...
2. ...
3. ...

Open AUDIT-REPORT.md for the full report."
```

**Step 3: Verify the file**

Read back `skills/cc-audit/SKILL.md` and confirm:
- YAML frontmatter has all 5 fields (name, description, disable-model-invocation, context, allowed-tools)
- All 5 phases are present
- All 8 audit areas (4.1–4.8) are present
- Each audit area has Scan, Fetch docs, and Evaluate sections
- Report template in Phase 5 has all sections
- No hardcoded best practices — all evaluation depends on fetching docs

**Step 4: Commit**

```bash
git add skills/cc-audit/SKILL.md
git commit -m "feat: add cc-audit skill — core audit logic

Single SKILL.md with forked context, doc-driven evaluation
across 8 audit areas, structured AUDIT-REPORT.md output.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Write README.md

**Files:**
- Create: `README.md`

**Step 1: Write README.md**

Create `README.md` with the exact content below:

```markdown
# CC Audit

A Claude Code skill that audits any project's Claude Code setup against the official Anthropic documentation.

Run `/cc-audit` in any project. Get a structured report telling you what's working, what could be better, and what needs fixing — every recommendation backed by the docs and filtered through your project's actual goal.

## Requirements

- [Claude Code](https://claude.ai/download) installed and authenticated
- [Anthropic Documentation MCP](https://github.com/anthropics/anthropic-docs-mcp) configured

## Installation

### 1. Set up the Anthropic Documentation MCP

```bash
claude mcp add anthropic-docs -- npx -y @anthropic-ai/anthropic-docs-mcp
```

### 2. Install the skill

Clone this repository and copy the skill to your global skills directory:

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-audit-tool.git
mkdir -p ~/.claude/skills
cp -r claude-code-audit-tool/skills/cc-audit ~/.claude/skills/cc-audit
```

Or create a symlink to stay updated with git pull:

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-audit-tool.git
mkdir -p ~/.claude/skills
ln -s "$(pwd)/claude-code-audit-tool/skills/cc-audit" ~/.claude/skills/cc-audit
```

### 3. Verify

Open Claude Code in any project and type `/cc-audit`. The skill should appear in autocomplete.

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

The audit runs in a forked context (`context: fork`) so it doesn't pollute your main conversation with the many file reads and doc fetches it performs. Only the final summary returns to your conversation.

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with installation and usage instructions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Test the Skill

**Step 1: Install the skill locally**

```bash
mkdir -p ~/.claude/skills
ln -s /Users/giovannicordova/Documents/02_projects/claude-code-audit-tool/skills/cc-audit ~/.claude/skills/cc-audit
```

**Step 2: Verify the skill appears**

Open a new Claude Code session in any project with a `.claude/` directory. Type `/cc-audit` and confirm it appears in autocomplete.

**Step 3: Run the audit**

Run `/cc-audit` against a test project. Verify:
- Phase 1: MCP dependency check passes
- Phase 2: Project files are scanned and understanding is formed
- Phase 3: User is asked to confirm the understanding
- Phase 4: Doc pages are fetched for each area, findings are generated
- Phase 5: AUDIT-REPORT.md is written with correct structure

**Step 4: Review the report**

Open the generated `AUDIT-REPORT.md` and verify:
- Project Understanding section matches what was confirmed
- Current State table is accurate
- Each finding has all 4 parts (Current, Recommendation, Project relevance, Source)
- Source links point to real Anthropic doc pages
- Priority Actions are ranked by impact
- Next Steps section is present

**Step 5: Clean up test output**

Delete the test `AUDIT-REPORT.md` from the test project.

---

### Task 5: Final Commit and Cleanup

**Step 1: Update VISION.md if needed**

If testing revealed any changes to the skill's behavior, update VISION.md to reflect the actual product.

**Step 2: Verify repo state**

```bash
cd /Users/giovannicordova/Documents/02_projects/claude-code-audit-tool
git status
git log --oneline
```

Expected structure:
```
claude-code-audit-tool/
├── .gitignore
├── CLAUDE.md          (empty — to be written after using the tool on itself)
├── STATE.md           (empty)
├── VISION.md
├── README.md
├── docs/
│   └── plans/
│       └── 2026-03-07-cc-audit-skill.md
└── skills/
    └── cc-audit/
        └── SKILL.md
```

**Step 3: Final commit if any changes**

```bash
git add -A
git commit -m "chore: finalize project structure

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

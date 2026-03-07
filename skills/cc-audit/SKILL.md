---
name: cc-audit
description: Audit a project's Claude Code setup against official Anthropic documentation. Evaluates CLAUDE.md, skills, sub-agents, hooks, MCP, permissions, settings, and project structure. Produces AUDIT-REPORT.md.
disable-model-invocation: true
context: fork
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, mcp__anthropic-docs__search_anthropic_docs, mcp__anthropic-docs__get_doc_page, mcp__anthropic-docs__list_doc_sections, mcp__anthropic-docs__index_status
hooks:
  Stop:
    - hooks:
        - type: agent
          prompt: >
            Read AUDIT-REPORT.md in the project root. Verify ALL of the following:
            1. A 'Project Understanding' section exists with a confirmed project goal
            2. A 'Current State' table exists with all 8 areas listed
            3. The 'Findings' section covers all 9 audit areas: CLAUDE.md, Skills, Sub-agents, Hooks, MCP, Permissions, Settings, Feature Selection, Rules
            4. Every finding has a 'Source' field with a documentation URL
            5. A 'Priority Actions' section exists
            6. A 'Next Steps' section exists
            If AUDIT-REPORT.md does not exist or any check fails, return {"ok": false, "reason": "Missing: [list what's missing]"}.
            If all checks pass, return {"ok": true}.
          timeout: 30
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

See https://github.com/giovicordova/anthropic-docs for details."

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

Use Glob to find everything under `.claude/` (including `.claude/rules/**/*.md`) and any root-level CLAUDE.md or CLAUDE.local.md files. This tells you what features are currently configured.

### Step 4: Form your understanding

Write down in this exact format:
- **PROJECT**: [what the project is, 1-2 sentences]
- **GOAL**: [what it's trying to achieve, 1-2 sentences]
- **CLAUDE CODE FEATURES IN USE**: [list]

YOUR NEXT TOOL CALL MUST BE AskUserQuestion. Do not call Read, Grep, Glob, or any other tool next.

## Phase 3: Confirm with User

YOUR NEXT ACTION MUST BE calling AskUserQuestion. Do not skip this phase.

Use AskUserQuestion with this message:

"**CC Audit — Project Understanding**

From my analysis, this project is [your understanding]. The goal is [your understanding of the goal].

Claude Code features currently in use: [list what you found]

Is this accurate, or do you have additional documentation I should review?"

Wait for the user's response. If they correct you or point to more files, read those files and update your understanding.

After the user confirms, write:

**CONFIRMED GOAL**: [the user-confirmed goal, in their words or yours if they said "yes"]

Do not proceed to Phase 4 until you have written CONFIRMED GOAL above.

## Phase 4: Audit

Using the CONFIRMED GOAL from Phase 3, audit each area below. If you have not yet confirmed the goal with the user, STOP and go back to Phase 3.

For each area below:
1. Read what currently exists in the project for this area
2. Fetch the relevant official doc page using `mcp__anthropic-docs__get_doc_page`
3. Compare the current state against the documentation
4. Filter through the CONFIRMED GOAL — only include findings that serve this project
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

### 4.9 Rules

**Scan:** `.claude/rules/**/*.md`

**Fetch docs:**
- `/docs/en/memory`

**Evaluate:**
- Do rules exist? Should they for this project's size and complexity?
- Are rules scoped to specific paths using `paths` frontmatter where appropriate?
- Is each rule file focused on one topic with a descriptive filename?
- Content in CLAUDE.md that would work better as path-scoped rules?
- Any rules that conflict with or duplicate CLAUDE.md instructions?
- Are rules organized into logical subdirectories for larger projects?

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

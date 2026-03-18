---
name: cc-audit
description: Audit a project's Claude Code setup against official Anthropic documentation. Evaluates CLAUDE.md, skills, sub-agents, hooks, MCP, permissions, settings, feature selection, and rules. Produces AUDIT-REPORT.md.
disable-model-invocation: true
context: fork
allowed-tools: Read, Glob, Grep, Write, Bash(npx @playwright/cli *), AskUserQuestion, mcp__anthropic-docs__search_anthropic_docs, mcp__anthropic-docs__get_doc_page, mcp__anthropic-docs__list_doc_sections, mcp__anthropic-docs__index_status, mcp__plugin_context7_context7__resolve-library-id, mcp__plugin_context7_context7__query-docs
---

# Claude Code Audit

You are auditing a project's Claude Code setup against the official Anthropic documentation. Follow each phase in order. Every recommendation must have two anchors: proof from the official docs, and a reason tied to the project's goal. If a best practice exists in the docs but does not serve the project, leave it out of the report.

STRICT RULE: Never generate a finding without a retrieved doc source. If you cannot fetch the documentation for a topic through any available method, exclude that topic entirely — do not guess, paraphrase from memory, or fabricate a source URL.

## Phase 1: Verify Documentation Sources

Check which documentation sources are available, in order:

1. **Try MCP first** — call `mcp__anthropic-docs__index_status`
   - If it succeeds → documentation mode is **MCP-primary** (MCP default, Playwright fallback)
2. **If MCP failed, try Playwright CLI** — run `npx @playwright/cli open https://docs.anthropic.com/en/docs/claude-code/overview` then `npx @playwright/cli snapshot` to confirm it loads
   - If it loads → documentation mode is **Playwright-only**
   - Close the browser with `npx @playwright/cli close`
3. **Both failed → stop.** Use AskUserQuestion to tell the user:

"CC Audit requires at least one documentation source. Set up either:

**Option A — Anthropic Documentation MCP (recommended):**
1. Run: `claude mcp add anthropic-docs -- npx -y @anthropic-ai/anthropic-docs-mcp`
2. Restart Claude Code

**Option B — Playwright CLI:**
1. Run: `npm install -g @playwright/cli`
2. Restart Claude Code

See https://github.com/giovicordova/anthropic-docs for details."

Then stop. Do not continue the audit.

Output the active documentation mode before proceeding.

## Documentation Fetching Protocol

This defines how "Fetch docs" works in every audit area of Phase 4.

**MCP-primary mode:**
1. Call `mcp__anthropic-docs__get_doc_page` with the listed path
2. If content returned → use it, record URL
3. If empty/error → fall back to Playwright CLI fetch

**Playwright CLI fetch (fallback or primary):**
1. Run `npx @playwright/cli open https://docs.anthropic.com/en/docs/claude-code/[topic]` (map from the MCP path)
2. Run `npx @playwright/cli snapshot` to capture page content
3. Extract relevant guidance from the snapshot output
4. After finishing all fetches for the current audit area, run `npx @playwright/cli close`
5. Record the full URL as source

**Rules:**
- Both methods fail for a doc path → skip that reference
- All doc references for an audit area fail → skip the area entirely, note it in the report as "Skipped — documentation unavailable"
- Never fabricate a URL — only use URLs you successfully fetched
- Append `(via MCP)` or `(via Playwright CLI)` to source lines in findings for provenance

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

Read each file from Step 1. For package manifests (package.json, pyproject.toml, etc.), focus on name, description, and dependencies — extract a list of key dependencies (libraries and services the project relies on).

### Step 3: Map the Claude Code setup

Use Glob to find everything under `.claude/` (including `.claude/rules/**/*.md`) and any root-level CLAUDE.md or CLAUDE.local.md files. This tells you what features are currently configured.

### Step 4: Form your understanding

Write down in this exact format:
- **PROJECT**: [what the project is, 1-2 sentences]
- **GOAL**: [what it's trying to achieve, 1-2 sentences]
- **KEY DEPENDENCIES**: [major libraries/services from package manifests — skip if none found]
- **CLAUDE CODE FEATURES IN USE**: [list]

YOUR NEXT TOOL CALL MUST BE AskUserQuestion. Do not call Read, Grep, Glob, or any other tool next.

## Phase 3: Confirm with User

You MUST call AskUserQuestion here. Do not skip this step. Do not present the question as text output instead. If you do not call AskUserQuestion, the audit is invalid.

Use AskUserQuestion with this message:

"**CC Audit — Project Understanding**

From my analysis, this project is [your understanding]. The goal is [your understanding of the goal].

Key dependencies identified: [list, or "none found"]

Claude Code features currently in use: [list what you found]

Is this accurate, or do you have additional documentation I should review?"

Wait for the user's response. If they correct you or point to more files, read those files and update your understanding.

After the user confirms, write:

**CONFIRMED GOAL**: [the user-confirmed goal, in their words or yours if they said "yes"]

Do not proceed to Phase 4 until you have written CONFIRMED GOAL above.

## Phase 4: Audit

Using the CONFIRMED GOAL from Phase 3, run the specialist passes below in order. If you have not yet confirmed the goal with the user, STOP and go back to Phase 3.

HARD RULE: Every finding must cite a doc source you actually fetched in this session. If all doc fetches for a specialist's areas fail, skip those areas and note them as "Skipped — documentation unavailable" in the report.

### Step 4.0: Bulk Doc Fetch

Fetch all documentation upfront using the Documentation Fetching Protocol. Store all content in working memory — specialists will use it from context.

Paths to fetch:
- `/docs/en/memory`
- `/docs/en/best-practices`
- `/docs/en/skills`
- `/docs/en/sub-agents`
- `/docs/en/hooks-guide`
- `/docs/en/permissions`
- `/docs/en/settings`
- `/docs/en/mcp`
- `/docs/en/features-overview`

### Step 4.1: Instructions Specialist

Read `agents/instructions-specialist.md`. Follow its instructions exactly.
Collect output under "INSTRUCTIONS SPECIALIST FINDINGS."

### Step 4.2: Components Specialist

Read `agents/components-specialist.md`. Follow its instructions exactly.
Collect output under "COMPONENTS SPECIALIST FINDINGS."

### Step 4.3: Automation Specialist

Read `agents/automation-specialist.md`. Follow its instructions exactly.
Collect output under "AUTOMATION SPECIALIST FINDINGS."

### Step 4.4: Integration Specialist

Read `agents/integration-specialist.md`. Follow its instructions exactly.
Collect output under "INTEGRATION SPECIALIST FINDINGS."

### Step 4.5: Adversarial Review

Read `agents/adversarial-reviewer.md`. Follow its instructions exactly.
Pass it all collected findings from Steps 4.1–4.4 and the CONFIRMED GOAL.
Replace all collected findings with the filtered set it returns.

Proceed to Phase 5 with the filtered findings only.

## Phase 5: Write Report

Write `AUDIT-REPORT.md` in the project root using this exact structure:

```
# Claude Code Audit Report

> Generated on [today's date]

## Project Understanding

[Confirmed project goal from Phase 3]

## Current State

| Area | What it is | Status |
|------|-----------|--------|
| CLAUDE.md | Your project's instructions to Claude | [Exists / Missing] |
| Skills | Reusable slash-command workflows | [X found / None] |
| Sub-agents | Isolated Claude sessions for specific tasks | [X found / None] |
| Hooks | Automated actions that run before/after Claude acts | [Configured / Not configured] |
| MCP | Connections to external tools and services | [X servers / Not configured] |
| Permissions | What Claude is allowed to do without asking | [Configured / Default] |
| Settings | Project-level Claude Code configuration | [Configured / Default] |
| Rules | Targeted instructions scoped to specific files or folders | [X found / None] |

## Findings

**Writing rule:** Write all findings in plain language. Avoid jargon — if a technical term is necessary, explain it briefly in parentheses. The reader is not a developer.

[For each area that has findings, use this format:]

### [Area Name] — [plain description from Current State table]

#### [good/improve/fix] Finding title

- **Current**: What exists now
- **Recommendation**: What should change (omit for "good" findings)
- **Project relevance**: Why this matters for this specific project
- **Source**: [Doc section title](full URL) (via MCP|Playwright CLI)

[Repeat for each finding. Group by area. Skip areas with no findings.]

## Priority Actions

[Top findings ranked by impact. Only include "improve" and "fix" items. Keep each action to one sentence.]

| # | Priority | What to do | Why it matters for your project |
|---|----------|-----------|-------------------------------|
| 1 | fix | [one-sentence action] | [one-sentence reason] |
| 2 | improve | [one-sentence action] | [one-sentence reason] |

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

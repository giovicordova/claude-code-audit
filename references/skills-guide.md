# The Complete Guide to Building Skills for Claude

Source: Official Anthropic guide (PDF). Extracted for audit reference.

## What Is a Skill

A skill is a folder containing:
- **SKILL.md** (required): Instructions in Markdown with YAML frontmatter
- **scripts/** (optional): Executable code (Python, Bash, etc.)
- **references/** (optional): Documentation loaded as needed
- **assets/** (optional): Templates, fonts, icons used in output

## Progressive Disclosure (Three Levels)

1. **First level (YAML frontmatter):** Always loaded into Claude's system prompt. Provides just enough info for Claude to know when the skill should be used without loading all of it into context.
2. **Second level (SKILL.md body):** Loaded when Claude thinks the skill is relevant to the current task. Contains the full instructions and guidance.
3. **Third level (Linked files):** Additional files bundled within the skill directory that Claude can choose to navigate and discover only as needed.

## Technical Requirements

### File Structure

```
your-skill-name/
├── SKILL.md                # Required - main skill file
├── scripts/                # Optional - executable code
│   ├── process_data.py
│   └── validate.sh
├── references/             # Optional - documentation
│   ├── api-guide.md
│   └── examples/
└── assets/                 # Optional - templates, etc.
    └── report-template.md
```

### Critical Naming Rules

**SKILL.md naming:**
- Must be exactly `SKILL.md` (case-sensitive)
- No variations accepted (SKILL.MD, skill.md, etc.)

**Skill folder naming:**
- Use kebab-case: `notion-project-setup`
- No spaces: ~~Notion Project Setup~~
- No underscores: ~~notion_project_setup~~
- No capitals: ~~NotionProjectSetup~~

**No README.md inside skill folder:**
- All documentation goes in SKILL.md or references/
- Note: repo-level README for human users is separate

## YAML Frontmatter

The YAML frontmatter is how Claude decides whether to load your skill. The most important part.

### Required Fields

```yaml
---
name: skill-name-in-kebab-case
description: What it does and when to use it. Include specific trigger phrases.
---
```

### name (required)
- kebab-case only
- No spaces or capitals
- Should match folder name

### description (required)
- MUST include BOTH: what the skill does + when to use it (trigger conditions)
- Under 1024 characters
- No XML tags (< or >)
- Include specific tasks users might say
- Mention file types if relevant

**Structure:** `[What it does] + [When to use it] + [Key capabilities]`

**Good descriptions:**
```
# Good - specific and actionable
description: Analyzes Figma design files and generates developer handoff documentation. Use when user uploads .fig files, asks for "design specs", "component documentation", or "design-to-code handoff".

# Good - includes trigger phrases
description: Manages Linear project workflows including sprint planning, task creation, and status tracking. Use when user mentions "sprint", "Linear tasks", "project planning", or asks to "create tickets".

# Good - clear value proposition
description: End-to-end customer onboarding workflow for PayFlow. Handles account creation, payment setup, and subscription management. Use when user says "onboard new customer", "set up subscription", or "create PayFlow account".
```

**Bad descriptions:**
```
# Too vague
description: Helps with projects.

# Missing triggers
description: Creates sophisticated multi-page documentation systems.

# Too technical, no user triggers
description: Implements the Project entity model with hierarchical relationships.
```

### Optional Fields

- **license:** MIT, Apache-2.0, etc.
- **compatibility:** 1-500 characters. Environment requirements (intended product, required system packages, network access needs, etc.)
- **allowed-tools:** Restrict which tools the skill can use
- **disable-model-invocation:** Set to true for side-effect workflows
- **user-invocable:** Controls whether users can invoke directly
- **context:** Set to `fork` for context isolation
- **metadata:** Custom key-value pairs (author, version, mcp-server, category, tags, etc.)

### Security Restrictions (Forbidden in Frontmatter)

- XML angle brackets (< >) — malicious content could inject instructions
- Skills with "claude" or "anthropic" in name (reserved)

### All Optional Fields Example

```yaml
name: skill-name
description: [required description]
license: MIT
allowed-tools: "Bash(python:*) Bash(npm:*) WebFetch"
metadata:
  author: Company Name
  version: 1.0.0
  mcp-server: server-name
  category: productivity
  tags: [project-management, automation]
  documentation: https://example.com/docs
  support: support@example.com
```

## Best Practices for Instructions

### Be Specific and Actionable

**Good:**
```
Run `python scripts/validate.py --input {filename}` to check data format.
If validation fails, common issues include:
- Missing required fields (add them to the CSV)
- Invalid date formats (use YYYY-MM-DD)
```

**Bad:**
```
Validate the data before proceeding.
```

### Reference Bundled Resources Clearly

```
Before writing queries, consult `references/api-patterns.md` for:
- Rate limiting guidance
- Pagination patterns
- Error codes and handling
```

### Use Progressive Disclosure

Keep SKILL.md focused on core instructions. Move detailed documentation to `references/` and link to it.

### Include Error Handling

```markdown
## Common Issues

### MCP Connection Failed
If you see "Connection refused":
1. Verify MCP server is running: Check Settings > Extensions
2. Confirm API key is valid
3. Try reconnecting: Settings > Extensions > [Your Service] > Reconnect
```

## Skill Use Case Categories

### Category 1: Document & Asset Creation
Creating consistent, high-quality output (documents, presentations, apps, designs, code, etc.)
- Embedded style guides and brand standards
- Template structures for consistent output
- Quality checklists before finalizing

### Category 2: Workflow Automation
Multi-step processes that benefit from consistent methodology.
- Step-by-step workflow with validation gates
- Templates for common structures
- Built-in review and improvement suggestions
- Iterative refinement loops

### Category 3: MCP Enhancement
Workflow guidance to enhance the tool access an MCP server provides.
- Coordinates multiple MCP calls in sequence
- Embeds domain expertise
- Provides context users would otherwise need to specify
- Error handling for common MCP issues

## Patterns

### Problem-first vs. Tool-first

- **Problem-first:** "I need to set up a project workspace" — Skill orchestrates the right MCP calls in the right sequence. Users describe outcomes; the skill handles the tools.
- **Tool-first:** "I have Notion MCP connected" — Skill teaches Claude the optimal workflows and best practices. Users have access; the skill provides expertise.

### Pattern 1: Sequential Workflow Orchestration
Use when: Multi-step processes in a specific order.
- Explicit step ordering
- Dependencies between steps
- Validation at each stage
- Rollback instructions for failures

### Pattern 2: Multi-MCP Coordination
Use when: Workflows span multiple services.
- Clear phase separation
- Data passing between MCPs
- Validation before moving to next phase
- Centralized error handling

### Pattern 3: Iterative Refinement
Use when: Output quality improves with iteration.
- Explicit quality criteria
- Iterative improvement
- Validation scripts
- Know when to stop iterating

### Pattern 4: Context-aware Tool Selection
Use when: Same outcome, different tools depending on context.
- Clear decision criteria
- Fallback options
- Transparency about choices

### Pattern 5: Domain-specific Intelligence
Use when: Your skill adds specialized knowledge beyond tool access.
- Domain expertise embedded in logic
- Compliance before action
- Comprehensive documentation
- Clear governance

## Troubleshooting

### Skill Won't Upload

**"Could not find SKILL.md in uploaded folder"**
- Rename to exactly SKILL.md (case-sensitive)
- Verify with: ls -la should show SKILL.md

**"Invalid frontmatter"**
- Must use `---` delimiters
- Common mistakes: missing delimiters, unclosed quotes

**"Invalid skill name"**
- Name has spaces or capitals
- Use kebab-case: `my-cool-skill`

### Skill Doesn't Trigger

Symptom: Skill never loads automatically.
- Fix: Revise description field
- Is it too generic? ("Helps with projects" won't work)
- Does it include trigger phrases users would actually say?
- Does it mention relevant file types if applicable?
- Debug: Ask Claude "When would you use the [skill name] skill?" — Claude will quote the description back. Adjust based on what's missing.

### Skill Triggers Too Often

Symptom: Skill loads for unrelated queries.
1. Add negative triggers in description
2. Be more specific
3. Clarify scope

### Instructions Not Followed

Common causes:
1. **Too verbose** — Keep concise, use bullets and numbered lists, move detailed reference to separate files
2. **Instructions buried** — Put critical instructions at the top, use ## Important or ## Critical headers, repeat key points if needed
3. **Ambiguous language** — Be specific and actionable
4. **Model "laziness"** — Add explicit encouragement in performance notes

### Large Context Issues

Symptom: Skill seems slow or responses degraded.
1. **Optimize SKILL.md size** — Move detailed docs to references/, link instead of inline, keep under 5,000 words
2. **Reduce enabled skills** — Evaluate if more than 20-50 enabled simultaneously, recommend selective enablement, consider skill "packs"

## Quick Checklist

### Before You Start
- [ ] Identified 2-3 concrete use cases
- [ ] Tools identified (built-in or MCP?)
- [ ] Reviewed guide and example skills
- [ ] Planned folder structure

### During Development
- [ ] Folder named in kebab-case
- [ ] SKILL.md file exists (exact spelling)
- [ ] YAML frontmatter has --- delimiters
- [ ] name field: kebab-case, no spaces, no capitals
- [ ] description includes WHAT and WHEN
- [ ] No XML tags (< >) anywhere
- [ ] Instructions are clear and actionable
- [ ] Error handling included
- [ ] Examples provided
- [ ] References clearly linked

### Before Upload
- [ ] Tested triggering on obvious tasks
- [ ] Tested triggering on paraphrased requests
- [ ] Verified doesn't trigger on unrelated topics
- [ ] Functional tests pass
- [ ] Tool integration works (if applicable)
- [ ] Compressed as .zip file

### After Upload
- [ ] Test in real conversations
- [ ] Monitor for under/over-triggering
- [ ] Collect user feedback
- [ ] Iterate on description and instructions
- [ ] Update version in metadata

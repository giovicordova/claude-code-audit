---
paths: ["SKILL.md", "agents/**/*.md", "references/**/*.md"]
---

- Preserve all 5 phases (Verify Documentation Sources, Understand Project, Confirm with User, Audit, Write Report)
- Preserve all 9 audit areas (4.1 CLAUDE.md through 4.9 Rules)
- SKILL.md stays under 500 lines; each file in `agents/` stays under 500 lines
- Frontmatter fields (`disable-model-invocation: true`, `allowed-tools`) must not change without deliberate reason
- Audit areas live in `agents/*.md`, not SKILL.md — each agent file must preserve: Scan targets, Evaluate checklist, Cross-cutting questions, Output format
- Agent groupings: instructions (4.1+4.9), components (4.2+4.3), automation (4.4+4.6+4.7), integration (4.5+4.8), adversarial-reviewer (quality gate)
- Report template in Phase 5 must stay in sync with audit areas
- Before editing: read SKILL.md and the relevant agent file first, then make targeted edits

import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { parsePages, diffManifests, parseSkillRefs, generateReport } from "./sync-docs.mjs";

describe("parsePages", () => {
  it("parses a single page from llms-full.txt format", () => {
    const text = `# Memory Guide
URL: https://code.claude.com/docs/en/memory

## Overview

Claude remembers your project through CLAUDE.md files.

## CLAUDE.md

The main memory file.
`;
    const pages = parsePages(text);
    assert.equal(pages.length, 1);
    assert.equal(pages[0].title, "Memory Guide");
    assert.equal(pages[0].path, "/docs/en/memory");
    assert.deepEqual(pages[0].headings, ["Overview", "CLAUDE.md"]);
    assert.equal(typeof pages[0].contentHash, "string");
    assert.equal(pages[0].contentHash.length, 64);
  });

  it("parses multiple pages", () => {
    const text = `# Memory Guide
URL: https://code.claude.com/docs/en/memory

## Overview

Content here.

# Skills
URL: https://code.claude.com/docs/en/skills

## Creating skills

Skill content.

## Frontmatter

YAML stuff.
`;
    const pages = parsePages(text);
    assert.equal(pages.length, 2);
    assert.equal(pages[0].path, "/docs/en/memory");
    assert.equal(pages[1].path, "/docs/en/skills");
    assert.deepEqual(pages[1].headings, ["Creating skills", "Frontmatter"]);
  });

  it("handles Source: prefix (alternative to URL:)", () => {
    const text = `# Hooks
Source: https://code.claude.com/docs/en/hooks-guide

## Setting up hooks

Content.
`;
    const pages = parsePages(text);
    assert.equal(pages.length, 1);
    assert.equal(pages[0].path, "/docs/en/hooks-guide");
  });

  it("skips h1 lines without a URL/Source line nearby", () => {
    const text = `# Random heading

No URL line here.

# Real Page
URL: https://code.claude.com/docs/en/real

## Content

Stuff.
`;
    const pages = parsePages(text);
    assert.equal(pages.length, 1);
    assert.equal(pages[0].path, "/docs/en/real");
  });
});

describe("diffManifests", () => {
  it("detects new pages", () => {
    const oldManifest = {
      pages: {
        "/docs/en/memory": { title: "Memory", contentHash: "aaa", headings: ["Overview"] },
      },
    };
    const newPages = [
      { title: "Memory", path: "/docs/en/memory", contentHash: "aaa", headings: ["Overview"] },
      { title: "Skills", path: "/docs/en/skills", contentHash: "bbb", headings: ["Setup"] },
    ];
    const diff = diffManifests(oldManifest, newPages);
    assert.equal(diff.added.length, 1);
    assert.equal(diff.added[0].path, "/docs/en/skills");
    assert.equal(diff.removed.length, 0);
    assert.equal(diff.changed.length, 0);
  });

  it("detects removed pages", () => {
    const oldManifest = {
      pages: {
        "/docs/en/memory": { title: "Memory", contentHash: "aaa", headings: ["Overview"] },
        "/docs/en/skills": { title: "Skills", contentHash: "bbb", headings: ["Setup"] },
      },
    };
    const newPages = [
      { title: "Memory", path: "/docs/en/memory", contentHash: "aaa", headings: ["Overview"] },
    ];
    const diff = diffManifests(oldManifest, newPages);
    assert.equal(diff.added.length, 0);
    assert.equal(diff.removed.length, 1);
    assert.equal(diff.removed[0].path, "/docs/en/skills");
    assert.equal(diff.changed.length, 0);
  });

  it("detects content changes via hash", () => {
    const oldManifest = {
      pages: {
        "/docs/en/memory": { title: "Memory", contentHash: "aaa", headings: ["Overview"] },
      },
    };
    const newPages = [
      { title: "Memory", path: "/docs/en/memory", contentHash: "bbb", headings: ["Overview"] },
    ];
    const diff = diffManifests(oldManifest, newPages);
    assert.equal(diff.changed.length, 1);
    assert.equal(diff.changed[0].path, "/docs/en/memory");
  });

  it("detects heading changes", () => {
    const oldManifest = {
      pages: {
        "/docs/en/memory": { title: "Memory", contentHash: "aaa", headings: ["Overview", "Setup"] },
      },
    };
    const newPages = [
      { title: "Memory", path: "/docs/en/memory", contentHash: "bbb", headings: ["Overview", "Configuration", "Advanced"] },
    ];
    const diff = diffManifests(oldManifest, newPages);
    assert.equal(diff.changed[0].addedHeadings.length, 2);
    assert.equal(diff.changed[0].removedHeadings.length, 1);
    assert.deepEqual(diff.changed[0].addedHeadings, ["Configuration", "Advanced"]);
    assert.deepEqual(diff.changed[0].removedHeadings, ["Setup"]);
  });

  it("returns empty diff when nothing changed", () => {
    const oldManifest = {
      pages: {
        "/docs/en/memory": { title: "Memory", contentHash: "aaa", headings: ["Overview"] },
      },
    };
    const newPages = [
      { title: "Memory", path: "/docs/en/memory", contentHash: "aaa", headings: ["Overview"] },
    ];
    const diff = diffManifests(oldManifest, newPages);
    assert.equal(diff.added.length, 0);
    assert.equal(diff.removed.length, 0);
    assert.equal(diff.changed.length, 0);
  });
});

describe("parseSkillRefs", () => {
  it("extracts doc paths grouped by audit area", () => {
    const skillContent = `
### 4.1 CLAUDE.md

**Fetch docs:**
- \`/docs/en/memory\`
- \`/docs/en/best-practices\`

**Evaluate:**
- Does it exist?

### 4.2 Skills

**Fetch docs:**
- \`/docs/en/skills\`

**Evaluate:**
- Has frontmatter?
`;
    const refs = parseSkillRefs(skillContent);
    assert.deepEqual(refs["4.1 CLAUDE.md"], ["/docs/en/memory", "/docs/en/best-practices"]);
    assert.deepEqual(refs["4.2 Skills"], ["/docs/en/skills"]);
  });

  it("returns all unique doc paths", () => {
    const skillContent = `
### 4.1 CLAUDE.md

**Fetch docs:**
- \`/docs/en/memory\`
- \`/docs/en/best-practices\`

### 4.9 Rules

**Fetch docs:**
- \`/docs/en/memory\`
`;
    const refs = parseSkillRefs(skillContent);
    const allPaths = [...new Set(Object.values(refs).flat())];
    assert.equal(allPaths.length, 2);
  });
});

describe("generateReport", () => {
  it("reports all clear when no drift and full coverage", () => {
    const diff = { added: [], removed: [], changed: [] };
    const skillRefs = { "4.1 CLAUDE.md": ["/docs/en/memory"] };
    const allPages = [{ path: "/docs/en/memory", title: "Memory" }];
    const report = generateReport(diff, skillRefs, allPages, "2026-03-08");
    assert.ok(report.includes("No drift detected"));
    assert.ok(!report.includes("## Broken References"));
    assert.ok(!report.includes("## Coverage Gaps"));
  });

  it("reports broken refs and coverage gaps", () => {
    const diff = { added: [], removed: [], changed: [] };
    const skillRefs = { "4.1 CLAUDE.md": ["/docs/en/memory", "/docs/en/gone"] };
    const allPages = [
      { path: "/docs/en/memory", title: "Memory" },
      { path: "/docs/en/skills", title: "Skills" },
    ];
    const report = generateReport(diff, skillRefs, allPages, "2026-03-08");
    assert.ok(report.includes("## Broken References"));
    assert.ok(report.includes("`/docs/en/gone`"));
    assert.ok(report.includes("## Coverage Gaps"));
    assert.ok(report.includes("`/docs/en/skills`"));
  });

  it("reports mixed drift — added, changed, removed", () => {
    const diff = {
      added: [{ path: "/docs/en/new", title: "New Feature" }],
      removed: [{ path: "/docs/en/old", title: "Old Feature" }],
      changed: [{ path: "/docs/en/memory", title: "Memory", addedHeadings: ["Rules"], removedHeadings: [] }],
    };
    const skillRefs = { "4.1 CLAUDE.md": ["/docs/en/memory"] };
    const allPages = [
      { path: "/docs/en/memory", title: "Memory" },
      { path: "/docs/en/new", title: "New Feature" },
    ];
    const report = generateReport(diff, skillRefs, allPages, "2026-03-08");
    assert.ok(report.includes("## New Pages"));
    assert.ok(report.includes("New Feature"));
    assert.ok(report.includes("**(not covered)**"));
    assert.ok(report.includes("## Changed Pages"));
    assert.ok(report.includes("+ Rules"));
    assert.ok(report.includes("## Removed Pages"));
    assert.ok(report.includes("Old Feature"));
  });
});

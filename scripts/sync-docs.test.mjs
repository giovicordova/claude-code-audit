import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { parsePages, diffManifests } from "./sync-docs.mjs";

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

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_URL = "https://code.claude.com/docs/llms-full.txt";
const MANIFEST_PATH = resolve(__dirname, "docs-manifest.json");
const SKILL_PATH = resolve(__dirname, "..", "skills", "cc-audit", "SKILL.md");
const REPORT_PATH = resolve(__dirname, "..", "DRIFT-REPORT.md");

export function parsePages(text) {
  const pages = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    if (lines[i].startsWith("# ")) {
      let urlLine = null;
      let urlLineIndex = -1;
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        if (lines[j].startsWith("URL: ") || lines[j].startsWith("Source: ")) {
          urlLine = lines[j];
          urlLineIndex = j;
          break;
        }
      }

      if (!urlLine) {
        i++;
        continue;
      }

      const title = lines[i].slice(2).trim();
      const url = urlLine.replace(/^(URL|Source): /, "").trim();
      let path;
      try {
        path = new URL(url).pathname;
      } catch {
        i++;
        continue;
      }

      const contentLines = [];
      i = urlLineIndex + 1;

      while (i < lines.length) {
        if (lines[i].startsWith("# ")) {
          let isNewPage = false;
          for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
            if (lines[j].startsWith("URL: ") || lines[j].startsWith("Source: ")) {
              isNewPage = true;
              break;
            }
          }
          if (isNewPage) break;
        }
        contentLines.push(lines[i]);
        i++;
      }

      const content = contentLines.join("\n").trim();
      if (content.length === 0) continue;

      const headings = [];
      for (const line of contentLines) {
        const match = line.match(/^#{2,3}\s+(.+)$/);
        if (match) headings.push(match[1].trim());
      }

      const contentHash = createHash("sha256").update(content).digest("hex");
      pages.push({ title, path, headings, contentHash });
    } else {
      i++;
    }
  }

  return pages;
}

export function diffManifests(oldManifest, newPages) {
  const oldPages = oldManifest.pages || {};
  const newByPath = Object.fromEntries(newPages.map((p) => [p.path, p]));
  const oldPaths = new Set(Object.keys(oldPages));
  const newPaths = new Set(Object.keys(newByPath));

  const added = newPages.filter((p) => !oldPaths.has(p.path));

  const removed = [...oldPaths]
    .filter((p) => !newPaths.has(p))
    .map((p) => ({ path: p, title: oldPages[p].title }));

  const changed = [];
  for (const path of oldPaths) {
    if (!newPaths.has(path)) continue;
    const oldPage = oldPages[path];
    const newPage = newByPath[path];
    if (oldPage.contentHash === newPage.contentHash) continue;

    const oldHeadings = new Set(oldPage.headings);
    const newHeadings = new Set(newPage.headings);
    const addedHeadings = newPage.headings.filter((h) => !oldHeadings.has(h));
    const removedHeadings = oldPage.headings.filter((h) => !newHeadings.has(h));

    changed.push({ path, title: newPage.title, addedHeadings, removedHeadings });
  }

  return { added, removed, changed };
}

export function parseSkillRefs(skillContent) {
  const refs = {};
  const lines = skillContent.split("\n");
  let currentArea = null;
  let inFetchDocs = false;

  for (const line of lines) {
    const areaMatch = line.match(/^###\s+(4\.\d+\s+.+)$/);
    if (areaMatch) {
      currentArea = areaMatch[1].trim();
      refs[currentArea] = [];
      inFetchDocs = false;
      continue;
    }

    if (line.includes("**Fetch docs:**")) {
      inFetchDocs = true;
      continue;
    }

    if (inFetchDocs && (line.startsWith("**") || line.startsWith("###") || line.startsWith("##"))) {
      inFetchDocs = false;
      if (line.startsWith("###")) {
        const reMatch = line.match(/^###\s+(4\.\d+\s+.+)$/);
        if (reMatch) {
          currentArea = reMatch[1].trim();
          refs[currentArea] = [];
        }
      }
      continue;
    }

    if (inFetchDocs && currentArea) {
      const pathMatch = line.match(/`(\/docs\/en\/[^`]+)`/);
      if (pathMatch) {
        refs[currentArea].push(pathMatch[1]);
      }
    }
  }

  return refs;
}

export function generateReport(diff, skillRefs, allPages, date) {
  const allDocPaths = new Set(allPages.map((p) => p.path));
  const coveredPaths = new Set(Object.values(skillRefs).flat());
  const uncoveredPages = allPages.filter((p) => !coveredPaths.has(p.path));

  const brokenRefs = [];
  for (const [area, paths] of Object.entries(skillRefs)) {
    for (const path of paths) {
      if (!allDocPaths.has(path)) {
        brokenRefs.push({ area, path });
      }
    }
  }

  const lines = [];
  lines.push("# Docs Drift Report");
  lines.push("");
  lines.push(`> Generated on ${date}`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`- **${allPages.length}** Claude Code doc pages found`);
  lines.push(`- **${diff.added.length}** new pages since last sync`);
  lines.push(`- **${diff.changed.length}** pages with content changes`);
  lines.push(`- **${diff.removed.length}** pages removed`);
  lines.push(`- **${brokenRefs.length}** broken references in SKILL.md`);
  lines.push(`- **${uncoveredPages.length}** pages not covered by any audit area`);
  lines.push("");

  const hasDrift = diff.added.length > 0 || diff.changed.length > 0 || diff.removed.length > 0 || brokenRefs.length > 0;

  if (!hasDrift && uncoveredPages.length === 0) {
    lines.push("No drift detected. SKILL.md is fully in sync.");
    lines.push("");
    return lines.join("\n");
  }

  if (brokenRefs.length > 0) {
    lines.push("## Broken References");
    lines.push("");
    lines.push("These doc paths are in SKILL.md but no longer exist:");
    lines.push("");
    for (const ref of brokenRefs) {
      lines.push(`- \`${ref.path}\` (used in ${ref.area})`);
    }
    lines.push("");
  }

  if (diff.added.length > 0) {
    lines.push("## New Pages");
    lines.push("");
    lines.push("These doc pages were added since last sync:");
    lines.push("");
    for (const page of diff.added) {
      const covered = coveredPaths.has(page.path) ? " (covered)" : " **(not covered)**";
      lines.push(`- \`${page.path}\` — ${page.title}${covered}`);
    }
    lines.push("");
  }

  if (diff.changed.length > 0) {
    lines.push("## Changed Pages");
    lines.push("");
    for (const page of diff.changed) {
      const covered = coveredPaths.has(page.path) ? " (covered)" : "";
      lines.push(`### \`${page.path}\`${covered}`);
      lines.push("");
      if (page.addedHeadings.length > 0) {
        lines.push("Sections added:");
        for (const h of page.addedHeadings) lines.push(`- + ${h}`);
      }
      if (page.removedHeadings.length > 0) {
        lines.push("Sections removed:");
        for (const h of page.removedHeadings) lines.push(`- - ${h}`);
      }
      if (page.addedHeadings.length === 0 && page.removedHeadings.length === 0) {
        lines.push("Content changed (no heading changes).");
      }
      lines.push("");
    }
  }

  if (diff.removed.length > 0) {
    lines.push("## Removed Pages");
    lines.push("");
    for (const page of diff.removed) {
      lines.push(`- \`${page.path}\` — ${page.title}`);
    }
    lines.push("");
  }

  if (uncoveredPages.length > 0) {
    lines.push("## Coverage Gaps");
    lines.push("");
    lines.push("These doc pages exist but no SKILL.md audit area references them:");
    lines.push("");
    for (const page of uncoveredPages) {
      lines.push(`- \`${page.path}\` — ${page.title}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

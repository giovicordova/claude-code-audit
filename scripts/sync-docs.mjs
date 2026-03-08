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

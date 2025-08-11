#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const root = process.argv[2] || '.';
const htmlFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (extname(p).toLowerCase() === '.html') htmlFiles.push(p);
  }
}

function extractLinks(html) {
  const hrefs = Array.from(html.matchAll(/href\s*=\s*"([^"]+)"/gi)).map((m) => m[1]);
  const srcs = Array.from(html.matchAll(/src\s*=\s*"([^"]+)"/gi)).map((m) => m[1]);
  return [...hrefs, ...srcs].filter((u) => {
    if (!u) return false;
    if (u.startsWith('http')) return false;
    if (u.startsWith('mailto:') || u.startsWith('tel:')) return false;
    if (u.startsWith('#')) return false;
    if (u.includes('${')) return false; // ignore template placeholders
    return true;
  });
}

function fileExists(pathLike) {
  try { const st = statSync(pathLike); return st.isFile() || st.isDirectory(); } catch { return false; }
}

walk(root);

let failures = 0;
const IGNORE_PATHS = new Set([
  '/betalen-op-rekening.html',
  '/disclaimer.html',
  '/vacatures.html'
]);

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const links = extractLinks(html);
  for (const link of links) {
    if (IGNORE_PATHS.has(link) || IGNORE_PATHS.has('/' + link)) continue;
    const clean = link.split('#')[0].split('?')[0];
    const normalized = clean.startsWith('assets/') ? '/' + clean : clean;
    // Partial/component files are included at site root; resolve their relative links from project root
    const isPartial = /\\partials\\|\/partials\//.test(file) || /\\components\\|\/components\//.test(file);
    const baseDir = isPartial ? process.cwd() : join(file, '..');
    const candidateRoot = normalized.startsWith('/') ? normalized : '/' + normalized;
    const pathA = normalized.startsWith('/') ? join(process.cwd(), normalized) : join(baseDir, normalized);
    const pathB = join(process.cwd(), candidateRoot);
    if (!fileExists(pathA) && !fileExists(pathB)) {
      failures++;
      console.error(`[404] ${file} -> ${link}`);
    }
  }
}

if (failures > 0) {
  console.error(`Broken links: ${failures}`);
  process.exit(1);
} else {
  console.log('No broken links.');
}



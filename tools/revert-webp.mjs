// Revert .webp references back to original raster images where available.
//
// Strategy:
// - Find all assets/images/**/[name].webp files
// - For each, check for side-by-side original with same basename and extension in [.jpg, .jpeg, .png]
// - Build mapping webpRel -> originalRel
// - Replace occurrences in all .html and assets css/js files
//
// Usage:
//   node tools/revert-webp.mjs

import path from 'node:path';
import fs from 'node:fs/promises';
import fg from 'fast-glob';

const projectRoot = path.resolve(process.cwd());

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function buildReplaceRegex(literalPath) {
  const escaped = literalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'g');
}

async function fileExists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function buildReverseMap() {
  const webps = await fg(['assets/images/**/*.webp'], { cwd: projectRoot, onlyFiles: true });
  const reverse = new Map(); // webpRel -> origRel
  const candidates = ['.jpg', '.jpeg', '.png'];

  for (const webpRel of webps.map(toPosix)) {
    const dir = path.posix.dirname(webpRel);
    const base = path.posix.basename(webpRel, '.webp');
    let chosen = null;
    for (const ext of candidates) {
      const origRel = `${dir}/${base}${ext}`;
      const origAbs = path.join(projectRoot, origRel);
      if (await fileExists(origAbs)) {
        chosen = origRel;
        break;
      }
    }
    if (chosen) reverse.set(webpRel, chosen);
  }
  return reverse;
}

async function updateReferences(reverseMap) {
  const files = await fg(
    [
      '**/*.html',
      'assets/**/*.{css,js}',
      '!node_modules/**',
      '!dist/**',
      '!build/**',
    ],
    { cwd: projectRoot, onlyFiles: true }
  );

  let changed = 0;
  for (const rel of files) {
    const abs = path.join(projectRoot, rel);
    const original = await fs.readFile(abs, 'utf-8');
    let updated = original;

    for (const [webpRel, origRel] of reverseMap.entries()) {
      const webpFwd = webpRel;
      const webpBack = webpRel.split('/').join('\\');
      const origFwd = origRel;
      const origBack = origRel.split('/').join('\\');

      updated = updated.replace(buildReplaceRegex(webpFwd), origFwd);
      updated = updated.replace(buildReplaceRegex(webpBack), origBack);
    }

    if (updated !== original) {
      await fs.writeFile(abs, updated, 'utf-8');
      changed += 1;
    }
  }
  return changed;
}

async function main() {
  console.log('Building reverse map from .webp to original images...');
  const reverseMap = await buildReverseMap();
  console.log(`Found ${reverseMap.size} .webp files with originals.`);
  const changed = await updateReferences(reverseMap);
  console.log(`Reverted references in ${changed} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});



// strip-devnotes.mjs
// Removes DEVNOTE HTML comments from built artifacts or source when invoked
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetDir = process.argv[2] || '.';
const ignoreDirs = new Set(['node_modules', '.git', 'assets/images']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const rel = path.join(dir, entry.name);
    const name = path.basename(rel);
    if (entry.isDirectory()) {
      if (ignoreDirs.has(name)) continue;
      walk(rel, out);
    } else if (rel.endsWith('.html') || rel.endsWith('.js')) {
      out.push(rel);
    }
  }
  return out;
}

if (process.env.NODE_ENV !== 'production') {
  console.log('NODE_ENV is not production; skipping DEVNOTE stripping.');
  process.exit(0);
}

const files = walk(path.resolve(root, targetDir));
const reComment = /<!--\s*DEVNOTE\[[\s\S]*?-->\s*/g;

let changed = 0;
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  const after = before.replace(reComment, '');
  if (after !== before) {
    fs.writeFileSync(f, after, 'utf8');
    changed++;
  }
}

console.log(`Stripped DEVNOTEs from ${changed} file(s).`);


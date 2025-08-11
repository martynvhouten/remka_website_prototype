// devnotes-report.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const outMd = path.join(root, 'DEVNOTES_REPORT.md');
const outCsv = path.join(root, 'DEVNOTES_REPORT.csv');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (abs.endsWith('.html') || abs.endsWith('.js')) out.push(abs);
  }
  return out;
}

const files = walk(root);
const re = /<!--\s*DEVNOTE\[hyva-slot,([^\]]+)\]\[owner=([^\]|]+)\|date=([0-9\-]{10})\]:\s*([^>]*?)-->/g;

const rows = [];
for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, '/');
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(txt))) {
    const [, scope, owner, date, body] = m;
    const target = (body.match(/Target:\s*handle=([^,]+),\s*phtml=([^\s.]+[^\s]*)\.?/) || []).slice(1);
    rows.push({ file: rel, scope, owner, date, handle: target[0] || '', phtml: target[1] || '', raw: body.trim() });
  }
}

rows.sort((a, b) => a.file.localeCompare(b.file));

// Markdown
let md = `# DEVNOTES Report\n\nTotal: ${rows.length}\n\n`;
md += '| File | Scope | Owner | Date | Handle | PHTML |\n|---|---|---|---|---|---|\n';
for (const r of rows) {
  md += `| ${r.file} | ${r.scope} | ${r.owner} | ${r.date} | ${r.handle} | ${r.phtml} |\n`;
}
fs.writeFileSync(outMd, md, 'utf8');

// CSV
let csv = 'file,scope,owner,date,handle,phtml\n';
for (const r of rows) {
  csv += `${JSON.stringify(r.file)},${r.scope},${r.owner},${r.date},${r.handle},${JSON.stringify(r.phtml)}\n`;
}
fs.writeFileSync(outCsv, csv, 'utf8');

console.log(`Wrote ${outMd} and ${outCsv}`);


#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

function walk(dir, list = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.git')) continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, list);
    else if (p.toLowerCase().endsWith('.html')) list.push(p);
  }
  return list;
}

const files = walk(root);
let changed = 0;

for (const file of files) {
  let html = readFileSync(file, 'utf8');
  const before = html;
  // Remove Tailwind CDN script tag
  html = html.replace(/\n?\s*<script\s+src="https:\/\/cdn\.tailwindcss\.com"[^>]*><\/script>\s*/gi, '\n');
  // Remove inline tailwind.config block
  html = html.replace(/\n?\s*<script>\s*tailwind\.config\s*=([\s\S]*?)<\/script>\s*/gi, '\n');

  // Ensure tailwind.css link exists
  if (!/assets\/css\/tailwind\.css/i.test(html)) {
    // insert before base.css link if present, else before closing head
    if (/<link[^>]+assets\/css\/base\.css[^>]*>/i.test(html)) {
      html = html.replace(
        /(<link[^>]+assets\/css\/base\.css[^>]*>)/i,
        '<link rel="stylesheet" href="/assets/css/tailwind.css" />\n    $1'
      );
    } else if (/<\/head>/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        '    <link rel="stylesheet" href="/assets/css/tailwind.css" />\n  </head>'
      );
    }
  }

  if (html !== before) {
    writeFileSync(file, html, 'utf8');
    changed++;
    console.log('Updated', file);
  }
}

console.log(`Done. Modified ${changed} file(s).`);



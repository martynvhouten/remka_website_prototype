// validate-devnotes.mjs
// Scans files for standardized DEVNOTE usage and forbidden notes
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const argv = new Set(process.argv.slice(2));
const onlyStaged = argv.has('--staged');
const strict = argv.has('--strict');

const allowedScopes = new Set([
  'brands', 'blog', 'plp', 'nav', 'forms', 'tokens', 'accessibility', 'checkout', 'account'
]);

const ignoreDirs = ['node_modules', '.git', 'docs', 'assets/images', 'dist'];
const exts = new Set(['.html', '.js']);

function listFiles() {
  if (onlyStaged) {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMRTUXB', { stdio: ['ignore', 'pipe', 'inherit'] })
        .toString()
        .trim();
      const files = out ? out.split(/\r?\n/) : [];
      return files.filter((f) => exts.has(path.extname(f)) && !ignoreDirs.some((d) => f.startsWith(d + '/')));
    } catch {
      // Fallback to full scan if git fails
    }
  }
  const results = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const rel = path.posix.join(path.relative(repoRoot, dir).replace(/\\/g, '/'), entry.name).replace(/^\.\/?/, '');
      if (ignoreDirs.some((d) => rel === d || rel.startsWith(d + '/'))) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (exts.has(path.extname(entry.name))) results.push(rel);
    }
  }
  walk(repoRoot);
  return results;
}

function parseDevnotes(content) {
  const notes = [];
  const re = /<!--\s*DEVNOTE\[hyva-slot,([^\]]+)\]\[owner=([^\]|]+)\|date=([0-9]{4}-[0-9]{2}-[0-9]{2})\]:[^>]*-->/g;
  let m;
  while ((m = re.exec(content))) {
    const devnoteOffset = m[0].indexOf('DEVNOTE[');
    const devnoteIndex = devnoteOffset >= 0 ? m.index + devnoteOffset : m.index;
    notes.push({ scope: m[1].trim(), owner: m[2].trim(), date: m[3].trim(), index: devnoteIndex });
  }
  return notes;
}

function daysBetween(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(+d)) return Infinity;
  const now = Date.now();
  return Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24));
}

const violations = [];
let converted = 0;
for (const file of listFiles()) {
  let content = fs.readFileSync(path.join(repoRoot, file), 'utf8');

  // Check forbidden phrases only inside comments
  const ext = path.extname(file);
  const htmlComments = [];
  const jsComments = [];
  if (ext === '.html') {
    const reHtml = /<!--([\s\S]*?)-->/g;
    let m;
    while ((m = reHtml.exec(content))) htmlComments.push({ text: m[1], index: m.index });
  } else if (ext === '.js') {
    const reBlock = /\/\*([\s\S]*?)\*\//g;
    const reLine = /(^|\n)\s*\/\/([^\n]*)/g;
    let m;
    while ((m = reBlock.exec(content))) jsComments.push({ text: m[1], index: m.index });
    while ((m = reLine.exec(content))) jsComments.push({ text: m[2], index: m.index });
  }
  const commentBlobs = ext === '.html' ? htmlComments : ext === '.js' ? jsComments : [];
  for (const c of commentBlobs) {
    if (/COPY TO PHTML/i.test(c.text)) {
      const upto = content.slice(0, c.index);
      const line = (upto.match(/\n/g) || []).length + 1;
      violations.push({ file, line, msg: 'Forbidden phrase "COPY TO PHTML" found' });
    }
    const todoLike = /\b(TODO|FIXME)\b/i;
    const m = c.text.match(todoLike);
    if (m) {
      const upto = content.slice(0, c.index);
      const line = (upto.match(/\n/g) || []).length + 1;
      violations.push({ file, line, msg: `Forbidden note "${m[1].toUpperCase()}"` });
    }
  }

  // DEVNOTE structure checks (HTML only)
  if (ext === '.html') {
    const rawDevnote = /DEVNOTE\[/g;
    const hasAnyDevnote = rawDevnote.test(content);
    if (!hasAnyDevnote) continue;
    const notes = parseDevnotes(content);
    // Find malformed DEVNOTEs (opened but not matching spec)
    const properlyIndexed = new Set(notes.map((n) => n.index));
    let idx = -1;
    while ((idx = content.indexOf('DEVNOTE[', idx + 1)) !== -1) {
      if (!properlyIndexed.has(idx)) {
        const upto = content.slice(0, idx);
        const line = (upto.match(/\n/g) || []).length + 1;
        violations.push({ file, line, msg: 'Malformed DEVNOTE. Expected <!-- DEVNOTE[hyva-slot,<scope>][owner=NAME|date=YYYY-MM-DD]: ... -->' });
      }
    }
    // Load mapping and CODEOWNERS fallback
    let handles = {};
    try {
      handles = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tools', 'hyva-handles.json'), 'utf8'));
    } catch {}

    let codeownersDefault = 'remka';
    try {
      const co = fs.readFileSync(path.join(repoRoot, 'CODEOWNERS'), 'utf8');
      const line = co.split(/\r?\n/).find((l) => l.trim().startsWith('frontend'));
      if (line) {
        const parts = line.trim().split(/\s+/);
        const owner = parts[1] || '';
        codeownersDefault = owner.replace(/^@/, '') || 'remka';
      }
    } catch {}

    // Auto-fix owner/date/targets when --apply present
    const autoApply = argv.has('--apply');

    function updateContentAt(idx, oldText, newText) {
      const before = content.slice(0, idx);
      const after = content.slice(idx + oldText.length);
      content = before + newText + after;
    }

    for (const n of notes) {
      const mapped = handles[file.replace(/\\/g, '/')];
      const scopeValid = allowedScopes.has(n.scope);

      const ownerOk = !!n.owner;
      const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(n.date) && daysBetween(n.date) <= (strict ? 0 : 60);
      // Locate exact DEVNOTE substring
      const devnoteRegex = /<!--\s*DEVNOTE\[hyva-slot,([^\]]+)\]\[owner=([^\]|]+)\|date=([0-9\-]+)\]:([^>]*?)-->/g;
      devnoteRegex.lastIndex = n.index;
      const found = devnoteRegex.exec(content);
      if (!found) continue;
      const fullMatch = found[0];
      let newMatch = fullMatch;

      // Remove any (verify) hints inside description
      newMatch = newMatch.replace(/\s*\(verify\)/g, '');

      // Inject mapping target if available
      if (mapped) {
        newMatch = newMatch.replace(/Target:\s*handle=[^,\s]*,\s*phtml=[^\s.]*[^.>]*\.?/, `Target: handle=${mapped.handle}, phtml=${mapped.phtml}.`);
      }

      // Normalize duplicated .phtml suffixes
      newMatch = newMatch.replace(/(\.phtml)(?:\.phtml)+/g, '$1');

      // Heuristic scope correction when invalid
      if (!scopeValid) {
        const filePath = file.replace(/\\/g, '/');
        let desired = n.scope;
        if (/\bhome[-/]/.test(filePath) || /content-hero|intro-hero|section-cards/.test(filePath)) desired = 'nav';
        else if (/\bproduct[-/]/.test(filePath)) desired = 'plp';
        else if (/\bcategory[-/]/.test(filePath) || /plp|toolbar|pagination|filters|facets/.test(filePath)) desired = 'plp';
        else if (/\bblog[-/]/.test(filePath)) desired = 'blog';
        else if (/\bbrands[-/]/.test(filePath)) desired = 'brands';
        else if (/minicart|checkout/.test(filePath)) desired = 'checkout';
        else if (/contact-card|service-/.test(filePath)) desired = 'account';
        else if (/accordion/.test(filePath)) desired = 'accessibility';
        if (!allowedScopes.has(desired)) desired = 'nav';
        newMatch = newMatch.replace(/DEVNOTE\[hyva-slot,[^\]]+\]/, `DEVNOTE[hyva-slot,${desired}]`);
      }

      // Fill missing owner/date if needed
      if (!ownerOk) {
        newMatch = newMatch.replace(/\[owner=([^\]|]+)\|date=/, `[owner=${codeownersDefault}|date=`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date)) {
        const today = new Date().toISOString().slice(0, 10);
        newMatch = newMatch.replace(/\|date=[0-9\-]+\]/, `|date=${today}]`);
      }

      if (autoApply && newMatch !== fullMatch) {
        updateContentAt(n.index, fullMatch, newMatch);
        converted++;
      }

      // Re-validate age in strict mode
      const effectiveDate = (newMatch.match(/\|date=([0-9\-]+)\]/) || [])[1] || n.date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
        violations.push({ file, line: 1, msg: 'DEVNOTE date must be YYYY-MM-DD' });
      } else if (daysBetween(effectiveDate) > 60) {
        violations.push({ file, line: 1, msg: `DEVNOTE date older than 60 days (${effectiveDate})` });
      }
    }

    // Write back any auto-applied changes
    if (autoApply && content) {
      fs.writeFileSync(path.join(repoRoot, file), content, 'utf8');
    }
  }
}

if (violations.length) {
  console.error('DEVNOTE validation failed:');
  for (const v of violations) {
    console.error(` - ${v.file}${v.line ? ':' + v.line : ''} ${v.msg}`);
  }
  process.exit(1);
}

console.log(`DEVNOTE validation passed${converted ? ` (auto-applied fixes: ${converted})` : ''}`);


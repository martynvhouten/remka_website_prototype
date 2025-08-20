// tools/strip-devnote-lines.mjs
// Remove any lines containing DEVNOTE[...] comments in partials and style-guide.html
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function forEachFile(startDir, filterExt = ['.html']){
  const out = [];
  function walk(dir){
    for(const entry of fs.readdirSync(dir, { withFileTypes: true })){
      if(entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      if(entry.isDirectory()) walk(abs);
      else if(filterExt.includes(path.extname(entry.name))) out.push(abs);
    }
  }
  walk(startDir);
  return out;
}

const targets = [];
const partialsDir = path.join(repoRoot, 'partials');
if (fs.existsSync(partialsDir)) targets.push(...forEachFile(partialsDir, ['.html']));
const styleGuide = path.join(repoRoot, 'style-guide.html');
if (fs.existsSync(styleGuide)) targets.push(styleGuide);

let changed = 0;
for(const file of targets){
  const text = fs.readFileSync(file, 'utf8');
  if (!/DEVNOTE\[/.test(text)) continue;
  const out = text.split(/\r?\n/).filter(line => !/DEVNOTE\[/.test(line)).join('\n');
  if(out !== text){
    fs.writeFileSync(file, out, 'utf8');
    changed++;
  }
}
console.log(`Stripped DEVNOTE lines in ${changed} files`);



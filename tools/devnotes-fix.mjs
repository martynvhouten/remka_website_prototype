// devnotes-fix.mjs
import { execSync } from 'node:child_process';

try {
  execSync('node tools/validate-devnotes.mjs --apply', { stdio: 'inherit' });
  console.log('Auto-fix applied. Re-running strict validation...');
  execSync('node tools/validate-devnotes.mjs --strict', { stdio: 'inherit' });
} catch (e) {
  process.exit(e?.status || 1);
}


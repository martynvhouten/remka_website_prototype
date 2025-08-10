/*
  Build a lightweight catalog from assets/images/Various with human-friendly fields only.
  Focus: title, description, tags, alt, dimensions, and preferred src (no conversions).

  Usage:
    node tools/build-various-catalog.mjs
*/

import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import sharp from 'sharp';
import * as exifr from 'exifr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function toPosix(p) { return p.split(path.sep).join('/'); }

function slugify(input){
  return String(input || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function getFiles(){
  const patterns = [
    'assets/images/Various/**/*.{webp,jpg,jpeg,png,JPG,JPEG,PNG,WEBP}',
  ];
  const files = await fg(patterns, { cwd: projectRoot, onlyFiles: true });
  return files.map(rel => ({ rel: toPosix(rel), abs: path.join(projectRoot, rel) }));
}

function groupByBase(files){
  const map = new Map();
  for(const f of files){
    const dir = path.posix.dirname(f.rel);
    const base = path.posix.basename(f.rel, path.posix.extname(f.rel));
    const key = `${dir}/${base}`;
    if(!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }
  return map;
}

function pickPreferred(files){
  // Prefer webp, then jpg/jpeg, then png
  const order = ['.webp', '.jpg', '.jpeg', '.png'];
  const byExt = new Map(files.map(f => [path.extname(f.rel).toLowerCase(), f]));
  for(const ext of order){ if(byExt.has(ext)) return byExt.get(ext); }
  return files[0];
}

function safeArray(val){
  if(Array.isArray(val)) return val.filter(Boolean).map(String);
  if(val == null) return [];
  return [String(val)];
}

function extractTitle(exif){
  if(!exif || typeof exif !== 'object') return '';
  const direct = exif.Title || exif.ObjectName || exif['ImageDescription'] || exif['Caption'] || exif['Caption-Abstract'] || '';
  if(direct) return String(direct).trim();
  // XMP dc:title can be an object or string
  const dc = exif.dc || exif.XMP || {};
  const dcTitle = (dc && (dc.title || (dc['dc:title'])));
  if(typeof dcTitle === 'string') return dcTitle.trim();
  if(dcTitle && typeof dcTitle === 'object'){
    // pick any language key
    const first = Object.values(dcTitle).find(Boolean);
    if(first) return String(first).trim();
  }
  return '';
}

function extractDescription(exif){
  if(!exif || typeof exif !== 'object') return '';
  const direct = exif['Caption'] || exif['Caption-Abstract'] || exif['ImageDescription'] || '';
  if(direct) return String(direct).trim();
  const photoshop = exif.photoshop || {};
  if(photoshop['Caption']) return String(photoshop['Caption']).trim();
  return '';
}

function extractTags(exif){
  if(!exif || typeof exif !== 'object') return [];
  const kw = safeArray(exif.Keywords);
  const subj = safeArray(exif.Subject);
  const iptc = exif.iptc || {};
  const iptcKeywords = safeArray(iptc['Keywords']);
  const xmp = exif.dc || {};
  const dcSubjects = safeArray(xmp['subject']);
  const merged = [...kw, ...subj, ...iptcKeywords, ...dcSubjects]
    .map(s => s.trim())
    .filter(Boolean);
  // unique, case-insensitive
  const seen = new Set();
  const out = [];
  for(const t of merged){ const key = t.toLowerCase(); if(!seen.has(key)){ seen.add(key); out.push(t); } }
  return out;
}

async function build(){
  const files = await getFiles();
  const grouped = groupByBase(files);
  const items = [];
  for(const [, variants] of grouped){
    const chosen = pickPreferred(variants);
    // metadata
    let meta = {};
    try { meta = await exifr.parse(chosen.abs, { iptc: true, xmp: true, tiff: true, exif: true }); } catch {}
    const title = extractTitle(meta);
    const description = extractDescription(meta);
    const tags = extractTags(meta);
    let dims = {};
    try { const s = await sharp(chosen.abs).metadata(); dims = { width: s.width, height: s.height, format: s.format }; } catch {}

    const rel = chosen.rel;
    const item = {
      src: `/${rel}`,
      title: title || path.posix.basename(rel).replace(/[-_]+/g, ' ').replace(/\.[^.]+$/, ''),
      description: description || '',
      alt: title || description || path.posix.basename(rel),
      tags,
      tagSlugs: tags.map(slugify),
      width: dims.width || null,
      height: dims.height || null,
      format: dims.format || path.extname(rel).replace('.', '').toLowerCase(),
    };
    items.push(item);
  }

  // Sort for stability: by title asc
  items.sort((a,b)=> String(a.title).localeCompare(String(b.title), 'nl'));

  const outPath = path.join(projectRoot, 'assets', 'images', 'various-catalog.json');
  await fs.writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2), 'utf-8');
  console.log(`Wrote ${items.length} items to ${toPosix(path.relative(projectRoot, outPath))}`);
}

build().catch((e)=>{ console.error(e); process.exitCode = 1; });



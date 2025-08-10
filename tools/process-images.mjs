/*
  Processes images in the project:
  - Extracts metadata (EXIF/IPTC/XMP) for images, with a focused report for `assets/images/Various`
  - Converts raster images (jpg/jpeg/png) to optimized WebP
  - Updates project references in .html/.css/.js to use .webp counterparts

  Usage:
    node tools/process-images.mjs [--dry]
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

const DRY_RUN = process.argv.includes('--dry');

const rasterExtensions = new Set(['.jpg', '.jpeg', '.png']);
const convertibleExtensions = new Set(['.jpg', '.jpeg', '.png']);
const skipExtensions = new Set(['.svg', '.webp']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJsonSafe(filePath, fallback = null) {
  try {
    const buf = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(buf);
  } catch {
    return fallback;
  }
}

async function getImageList() {
  const patterns = [
    'assets/images/**/*.{jpg,jpeg,png,svg,gif,JPG,JPEG,PNG,SVG,GIF}',
  ];
  const entries = await fg(patterns, {
    cwd: projectRoot,
    dot: false,
    onlyFiles: true,
    followSymbolicLinks: true,
  });
  return entries.map((rel) => ({
    relPath: toPosix(rel),
    absPath: path.join(projectRoot, rel),
    ext: path.extname(rel).toLowerCase(),
  }));
}

function webpTargetPath(relPath) {
  const dir = path.posix.dirname(relPath);
  const base = path.posix.basename(relPath, path.posix.extname(relPath));
  return `${dir}/${base}.webp`;
}

function truncateString(input, maxLen = 1000) {
  if (typeof input !== 'string') return input;
  return input.length > maxLen ? `${input.slice(0, maxLen)}…` : input;
}

function sanitizeObject(obj, options = {}) {
  const { maxArray = 20, maxString = 1000, allowedKeys = null } = options;
  if (!obj || typeof obj !== 'object') return obj;

  const out = {};
  const keys = allowedKeys ?? Object.keys(obj);
  for (const key of keys) {
    if (!(key in obj)) continue;
    const val = obj[key];
    if (val == null) continue;
    if (typeof val === 'string') {
      out[key] = truncateString(val, maxString);
    } else if (Array.isArray(val)) {
      out[key] = val.slice(0, maxArray).map((v) => (typeof v === 'string' ? truncateString(v, maxString) : v));
    } else if (typeof val === 'object') {
      // Shallowly sanitize nested objects by selecting primitive fields only
      const nested = {};
      for (const nk of Object.keys(val)) {
        const nv = val[nk];
        if (nv == null) continue;
        if (typeof nv === 'string' || typeof nv === 'number' || typeof nv === 'boolean') {
          nested[nk] = typeof nv === 'string' ? truncateString(nv, maxString) : nv;
        }
      }
      if (Object.keys(nested).length) out[key] = nested;
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      out[key] = val;
    }
  }
  return out;
}

function sanitizeExif(exif) {
  if (!exif || typeof exif !== 'object') return {};
  const allowed = [
    // Common EXIF
    'Make', 'Model', 'Orientation', 'DateTimeOriginal', 'CreateDate', 'ModifyDate', 'LensModel',
    'Software', 'Artist', 'Copyright', 'ImageDescription',
    // IPTC-like fields often present in parsed result
    'Caption', 'Caption-Abstract', 'Title', 'ObjectName', 'Keywords', 'Subject', 'Creator', 'Byline', 'Credit', 'Source', 'City', 'Country', 'Country-PrimaryLocationName', 'Province-State',
    // XMP common
    'XMP', 'dc', 'photoshop', 'xmp', 'iptc', 'tiff', 'exif',
  ];
  const base = sanitizeObject(exif, { allowedKeys: allowed, maxArray: 50, maxString: 2000 });
  // Flatten some common nested containers if present
  if (exif.dc && typeof exif.dc === 'object') {
    base.dc = sanitizeObject(exif.dc, { maxArray: 50, maxString: 2000 });
  }
  if (exif.photoshop && typeof exif.photoshop === 'object') {
    base.photoshop = sanitizeObject(exif.photoshop, { maxArray: 50, maxString: 2000 });
  }
  if (exif.iptc && typeof exif.iptc === 'object') {
    base.iptc = sanitizeObject(exif.iptc, { maxArray: 50, maxString: 2000 });
  }
  if (exif.XMP && typeof exif.XMP === 'object') {
    base.XMP = sanitizeObject(exif.XMP, { maxArray: 50, maxString: 2000 });
  }
  return base;
}

function sanitizeSharpMeta(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const picked = {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    space: meta.space,
    channels: meta.channels,
    density: meta.density,
    hasProfile: meta.hasProfile,
    hasAlpha: meta.hasAlpha,
  };
  return picked;
}

async function extractMetadata(absPath, full = false) {
  try {
    const sharpMeta = sanitizeSharpMeta(await sharp(absPath).metadata());
    let parsed = {};
    if (full) {
      try {
        const raw = await exifr.parse(absPath, {
          tiff: true,
          ifd0: true,
          exif: true,
          iptc: true,
          xmp: true,
        });
        parsed = sanitizeExif(raw);
      } catch {
        parsed = {};
      }
    }
    return { sharp: sharpMeta, exifIptcXmp: parsed };
  } catch (err) {
    return { error: String(err) };
  }
}

async function convertToWebp(inputAbsPath, outputAbsPath, sourceExt) {
  const isPng = sourceExt === '.png';
  const options = {
    quality: isPng ? 82 : 82,
    effort: 5,
    nearLossless: isPng,
  };
  await ensureDir(path.dirname(outputAbsPath));
  await sharp(inputAbsPath).webp(options).toFile(outputAbsPath);
}

async function statSize(absPath) {
  try {
    const st = await fs.stat(absPath);
    return st.size;
  } catch {
    return null;
  }
}

async function processImages() {
  const allImages = await getImageList();

  const report = [];
  const variousReport = [];
  const replaceMap = new Map(); // origRel -> webpRel

  for (const img of allImages) {
    if (skipExtensions.has(img.ext)) continue;

    const isVarious = img.relPath.startsWith('assets/images/Various/');
    const meta = await extractMetadata(img.absPath, isVarious);

    const relPosix = img.relPath;
    const targetRel = webpTargetPath(relPosix);
    const targetAbs = path.join(projectRoot, targetRel);

    let converted = false;
    let error = null;
    if (convertibleExtensions.has(img.ext)) {
      try {
        if (!DRY_RUN) {
          await convertToWebp(img.absPath, targetAbs, img.ext);
        }
        converted = true;
        replaceMap.set(relPosix, targetRel);
      } catch (e) {
        error = String(e);
      }
    } else {
      // Not converted (e.g., gif), but still set mapping if a .webp already exists
      const maybeExisting = await statSize(targetAbs);
      if (maybeExisting != null) {
        replaceMap.set(relPosix, targetRel);
      }
    }

    const sizeOriginal = await statSize(img.absPath);
    const sizeWebp = await statSize(targetAbs);

    const entry = {
      file: relPosix,
      format: img.ext.replace('.', ''),
      convertedToWebp: converted,
      webpPath: sizeWebp != null ? targetRel : null,
      bytesOriginal: sizeOriginal,
      bytesWebp: sizeWebp,
      bytesSaved: sizeWebp != null && sizeOriginal != null ? sizeOriginal - sizeWebp : null,
      metadata: meta,
      error,
    };
    report.push(entry);
    if (relPosix.startsWith('assets/images/Various/')) {
      variousReport.push(entry);
    }
  }

  // Write reports
  const outDir = path.join(projectRoot, 'assets', 'images');
  if (!DRY_RUN) {
    await ensureDir(outDir);
    await fs.writeFile(
      path.join(outDir, 'image-report.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), images: report }, null, 2),
      'utf-8'
    );
    await fs.writeFile(
      path.join(outDir, 'various-metadata.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), images: variousReport }, null, 2),
      'utf-8'
    );
  }

  return { replaceMap };
}

function buildReplaceRegex(literalPath) {
  const escaped = literalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'g');
}

async function updateReferences(replaceMap) {
  // Collect files to update
  const files = await fg(
    [
      '**/*.html',
      'assets/**/*.{css,js}',
      '!node_modules/**',
      '!dist/**',
      '!build/**',
      '!**/*.webp',
    ],
    { cwd: projectRoot, onlyFiles: true }
  );

  let totalReplacements = 0;
  for (const rel of files) {
    const abs = path.join(projectRoot, rel);
    const original = await fs.readFile(abs, 'utf-8');
    let updated = original;

    // Replace both forward and backslash variants just in case
    for (const [origRel, webpRel] of replaceMap.entries()) {
      const origForward = origRel;
      const origBackward = origRel.split('/').join('\\');
      const webpForward = webpRel;
      const webpBackward = webpRel.split('/').join('\\');

      updated = updated.replace(buildReplaceRegex(origForward), webpForward);
      updated = updated.replace(buildReplaceRegex(origBackward), webpBackward);
    }

    if (updated !== original) {
      totalReplacements += 1;
      if (!DRY_RUN) {
        await fs.writeFile(abs, updated, 'utf-8');
      }
    }
  }

  return { filesChanged: totalReplacements };
}

async function main() {
  console.log(`Processing images${DRY_RUN ? ' (dry run)' : ''}...`);
  const { replaceMap } = await processImages();
  console.log(`Images processed. Updating references...`);
  const { filesChanged } = await updateReferences(replaceMap);
  console.log(`Done. Updated files: ${filesChanged}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});



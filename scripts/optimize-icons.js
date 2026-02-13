const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [16, 48];

function toSlug(filename) {
  return filename
    .replace(/\.png$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  // Create output directories
  for (const size of SIZES) {
    const dir = path.join(ICONS_DIR, String(size));
    fs.mkdirSync(dir, { recursive: true });
  }

  // Get all PNG files in root icons directory (not subdirectories)
  const files = fs.readdirSync(ICONS_DIR).filter((f) => {
    const full = path.join(ICONS_DIR, f);
    return fs.statSync(full).isFile() && /\.png$/i.test(f);
  });

  console.log(`Found ${files.length} PNG files to optimize`);

  let processed = 0;
  const errors = [];

  for (const file of files) {
    const src = path.join(ICONS_DIR, file);
    const slug = toSlug(file);

    for (const size of SIZES) {
      const dest = path.join(ICONS_DIR, String(size), `${slug}.webp`);
      try {
        await sharp(src)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 90 })
          .toFile(dest);
      } catch (err) {
        errors.push(`${file} @ ${size}: ${err.message}`);
      }
    }

    processed++;
    if (processed % 50 === 0) {
      console.log(`  ${processed}/${files.length} done`);
    }
  }

  console.log(`\nOptimized ${processed} icons into ${SIZES.join(', ')}px WebP`);

  if (errors.length > 0) {
    console.log(`\n${errors.length} errors:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  // Delete originals
  let deleted = 0;
  for (const file of files) {
    fs.unlinkSync(path.join(ICONS_DIR, file));
    deleted++;
  }

  // Also delete any leftover SVGs from old Next.js template
  const svgs = fs.readdirSync(ICONS_DIR).filter((f) => {
    const full = path.join(ICONS_DIR, f);
    return fs.statSync(full).isFile() && /\.svg$/i.test(f);
  });
  for (const svg of svgs) {
    fs.unlinkSync(path.join(ICONS_DIR, svg));
    deleted++;
  }

  console.log(`Deleted ${deleted} original files`);

  // Report final size
  let totalBytes = 0;
  for (const size of SIZES) {
    const dir = path.join(ICONS_DIR, String(size));
    const webps = fs.readdirSync(dir);
    let dirBytes = 0;
    for (const f of webps) {
      dirBytes += fs.statSync(path.join(dir, f)).size;
    }
    totalBytes += dirBytes;
    console.log(`  ${size}px: ${webps.length} files, ${(dirBytes / 1024 / 1024).toFixed(2)} MB`);
  }
  console.log(`  Total: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);

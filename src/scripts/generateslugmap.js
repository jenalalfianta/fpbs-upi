// scripts/generateslugmap.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direktori sumber & target output
const rootDir = path.resolve(__dirname, '../pages');
const outputFile = path.resolve(__dirname, '../utils/i18nSlugMap.js');
const beritaDir = path.resolve(__dirname, '../content/berita');
const prodiDir = path.resolve(__dirname, '../content/program-studi');

// Map hasil
const map = {};

/**
 * Slugify konsisten dengan content config:
 * - Normalisasi diakritik → ASCII
 * - Semua variasi dash (‐ - ‒ – — ― −) → hyphen minus '-'
 * - Buang karakter non-alfanumerik (kecuali spasi, '-', '_')
 * - Spasi → '-'
 * - Collapse hyphen ganda
 * - Trim hyphen di pinggir
 * - Lowercase
 */
function makeSlug(s) {
  return String(s)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-') // semua dash → '-'
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Bangun path HTML dari file .astro non-dinamis.
 * - Menghapus prefix 'en/' untuk perhitungan rel path
 * - Menghapus 'index' di akhir
 * - Mengganti backslash menjadi slash
 */
function getHtmlPath(filePath, langPrefix = '') {
  const rel = filePath
    .replace(rootDir + path.sep, '')
    .replace(/^en[\\/]/, '')
    .replace(/\.astro$/, '')
    .replace(/[/\\]index$/, '')
    .replaceAll('\\', '/');
  return `/${langPrefix}${rel}${rel ? '/index.html' : 'index.html'}`;
}

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  return files
    .flatMap(file => {
      const fullPath = path.join(dir, file.name);
      return file.isDirectory() ? walk(fullPath) : fullPath;
    })
    .filter(f => f.endsWith('.astro'));
}

function walkMd(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? walkMd(fullPath) : fullPath;
    })
    .filter(f => f.endsWith('.md'));
}

/**
 * Scan halaman .astro statis yang mengandung `const slugId = '...'`
 * untuk dipetakan ID <-> EN. Menghindari file dinamis [slug], [page], dsb.
 */
function parseAstroFiles(lang) {
  const baseDir = lang === 'en' ? path.join(rootDir, 'en') : rootDir;

  const files = walk(baseDir).filter(f => {
    const rel = f.replace(rootDir + path.sep, '');
    const isDynamic = rel.includes('['); // skip file dinamis
    const isInLang = lang === 'en'
      ? rel.startsWith('en' + path.sep)
      : !rel.startsWith('en' + path.sep);
    return isInLang && !isDynamic;
  });

  const results = [];

  files.forEach(file => {
    const raw = fs.readFileSync(file, 'utf-8');
    const matches = [...raw.matchAll(/const\s+slugId\s*=\s*['"`](.*?)['"`]/g)];

    if (matches.length === 0) {
      // Hanya warning agar tahu halaman mana yang belum punya slugId
      console.warn(`⚠️  Missing slugId in ${file}`);
      return;
    }
    if (matches.length > 1) {
      console.warn(`⚠️  Multiple slugId declarations in ${file}`);
    }

    const slugId = matches[0][1];

    results.push({
      lang,
      slugId,
      file,
      path: getHtmlPath(file, lang === 'en' ? 'en/' : ''),
    });
  });

  return results;
}

/** 1) Pemetaan halaman Astro statis berbasis slugId */
const idPages = parseAstroFiles('id');
const enPages = parseAstroFiles('en');

idPages.forEach(idPage => {
  const match = enPages.find(enPage => enPage.slugId === idPage.slugId);
  if (!match) {
    console.warn(`⚠️  EN not found for slugId: ${idPage.slugId}`);
    return;
  }

  map[idPage.path] = match.path;
  map[match.path] = idPage.path;
});

/** 2) Pemetaan BERITA (Markdown) */
if (fs.existsSync(beritaDir)) {
  const beritaFiles = walkMd(beritaDir);

  const berita = beritaFiles.map(file => {
    const raw = fs.readFileSync(file, 'utf-8');
    const { data } = matter(raw);
    if (!data.slugId || !data.lang || !data.title) {
      console.warn(`⚠️  Missing slugId/lang/title in berita: ${file}`);
      return null;
    }

    // Pakai frontmatter.slug kalau ada, selain itu hitung dengan makeSlug(title)
    const slug = data.slug ? String(data.slug) : makeSlug(data.title);

    return {
      slugId: String(data.slugId),
      lang: String(data.lang),
      title: String(data.title),
      slug,
    };
  }).filter(Boolean);

  // Pasangkan ID <-> EN berdasarkan slugId
  berita.forEach(src => {
    const target = berita.find(b => b.slugId === src.slugId && b.lang !== src.lang);
    if (!target) return;

    const getPath = (entry) =>
      `/${entry.lang === 'en' ? 'en/news' : 'berita'}/${entry.slug}/index.html`;

    const srcPath = getPath(src);
    const targetPath = getPath(target);

    map[srcPath] = targetPath;
    map[targetPath] = srcPath;
  });

  // Pemetaan pagination daftar berita (tetap sama)
  const newsCount = berita.filter(b => b.lang === 'en').length;
  const perPage = 9;
  const totalPages = Math.ceil(newsCount / perPage);
  for (let i = 1; i <= totalPages; i++) {
    const idPage = `/berita/page/${i}/index.html`;
    const enPage = `/en/news/page/${i}/index.html`;
    map[idPage] = enPage;
    map[enPage] = idPage;
  }

  // Pemetaan index daftar berita
  map['/berita/index.html'] = '/en/news/index.html';
  map['/en/news/index.html'] = '/berita/index.html';
}

/** 3) Pemetaan PROGRAM STUDI (Markdown) */
if (fs.existsSync(prodiDir)) {
  const prodiFiles = walkMd(prodiDir);

  const prodi = prodiFiles.map(file => {
    const raw = fs.readFileSync(file, 'utf-8');
    const { data } = matter(raw);
    if (!data.slugId || !data.lang || !data.title) {
      console.warn(`⚠️  Missing slugId/lang/title in program-studi: ${file}`);
      return null;
    }

    // Untuk prodi, kalau ada frontmatter.slug gunakan; jika tidak ada, fallback nama file
    const fileSlug = path.basename(file, '.md');
    const slug = data.slug ? String(data.slug) : fileSlug;

    return {
      lang: String(data.lang),
      slugId: String(data.slugId),
      title: String(data.title),
      slug,
      file,
      menu: data.menu || [],
    };
  }).filter(Boolean);

  const idProdi = prodi.filter(p => p.lang === 'id');
  const enProdi = prodi.filter(p => p.lang === 'en');

  idProdi.forEach(idEntry => {
    const enEntry = enProdi.find(e => e.slugId === idEntry.slugId);
    if (!enEntry) {
      console.warn(`⚠️  EN slugId not found for: ${idEntry.slugId}`);
      return;
    }

    const baseId = `/program-studi/${idEntry.slug}`;
    const baseEn = `/en/study-programs/${enEntry.slug}`;

    // profil <-> profile
    map[`${baseId}/profil/index.html`] = `${baseEn}/profile/index.html`;
    map[`${baseEn}/profile/index.html`] = `${baseId}/profil/index.html`;

    // tab lain: gunakan id yang sama (kamu sudah pastikan id konsisten di kedua bahasa)
    const idMenu = (idEntry.menu || []).filter(m => !m.external);
    const enMenu = (enEntry.menu || []).filter(m => !m.external);
    const allTabs = [...new Set([...(idMenu.map(m => m.id)), ...(enMenu.map(m => m.id))])];

    allTabs.forEach(tabId => {
      map[`${baseId}/${tabId}/index.html`] = `${baseEn}/${tabId}/index.html`;
      map[`${baseEn}/${tabId}/index.html`] = `${baseId}/${tabId}/index.html`;
    });
  });
}

// Tulis file output
const output = `export const slugMap = ${JSON.stringify(map, null, 2)};\n`;
fs.writeFileSync(outputFile, output);
console.log(`[OK] slugMap generated (${Object.keys(map).length} entries)`);

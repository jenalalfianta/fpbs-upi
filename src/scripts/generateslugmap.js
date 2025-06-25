import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../pages');
const outputFile = path.resolve(__dirname, '../utils/i18nSlugMap.js');
const beritaDir = path.resolve(__dirname, '../content/berita');
const ENABLE_STATIC_PAGES = false;

const map = {};

// 🔠 Ubah title menjadi slug (slugify)
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '') // hilangkan diakritik
    .replace(/[^a-z0-9\s-]/g, '')    // hilangkan karakter spesial
    .trim()
    .replace(/\s+/g, '-')            // spasi → -
    .replace(/-+/g, '-');            // hilangkan duplikat -
}

// 🛠️ Konversi path file ke URL akhir (HTML)
function getHtmlPath(filePath, langPrefix = '') {
  const rel = filePath
    .replace(rootDir + path.sep, '')
    .replace(/^en[\\/]/, '')
    .replace(/\.astro$/, '')
    .replace(/[/\\]index$/, '')
    .replaceAll('\\', '/');
  return `/${langPrefix}${rel}${rel ? '/index.html' : 'index.html'}`;
}

// Rekursif baca .astro
function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  return files.flatMap(file => {
    const fullPath = path.join(dir, file.name);
    return file.isDirectory() ? walk(fullPath) : fullPath;
  }).filter(f => f.endsWith('.astro'));
}

// Rekursif baca .md berita
function walkMd(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walkMd(fullPath) : fullPath;
  }).filter(f => f.endsWith('.md'));
}

// 🟢 Halaman statis bilingual (jika diaktifkan)
if (ENABLE_STATIC_PAGES) {
  const enFiles = walk(path.join(rootDir, 'en'));
  enFiles.forEach(file => {
    const enPath = getHtmlPath(file, 'en/');
    const idPath = getHtmlPath(file);
    map[enPath] = idPath;
    map[idPath] = enPath;
  });
}

// 🟢 Generate slug bilingual dari berita
if (fs.existsSync(beritaDir)) {
  const beritaFiles = walkMd(beritaDir);

  const berita = beritaFiles.map(file => {
    const raw = fs.readFileSync(file, 'utf-8');
    const { data } = matter(raw);
    if (!data.slugId || !data.lang || !data.title) return null;

    return {
      slugId: data.slugId,
      lang: data.lang,
      title: data.title,
      slug: slugify(data.title),
    };
  }).filter(Boolean);

  // Cocokkan antar bahasa via slugId
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

  // 🟢 Pagination bilingual otomatis
  const newsCount = berita.filter(b => b.lang === 'en').length;
  const perPage = 9;
  const totalPages = Math.ceil(newsCount / perPage);

  for (let i = 1; i <= totalPages; i++) {
    const idPage = `/berita/page/${i}/index.html`;
    const enPage = `/en/news/page/${i}/index.html`;
    map[idPage] = enPage;
    map[enPage] = idPage;
  }

  // index utama /berita <-> /en/news
  map['/berita/index.html'] = '/en/news/index.html';
  map['/en/news/index.html'] = '/berita/index.html';
}

// 🔚 Simpan hasil
const output = `export const slugMap = ${JSON.stringify(map, null, 2)};\n`;
fs.writeFileSync(outputFile, output);
console.log(`[OK] slugMap generated (${Object.keys(map).length} entries)`);

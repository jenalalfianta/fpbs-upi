import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../pages');
const outputFile = path.resolve(__dirname, '../utils/i18nSlugMap.js');
const beritaDir = path.resolve(__dirname, '../content/berita');
const prodiDir = path.resolve(__dirname, '../content/program-studi');

const map = {};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
  return files.flatMap(file => {
    const fullPath = path.join(dir, file.name);
    return file.isDirectory() ? walk(fullPath) : fullPath;
  }).filter(f => f.endsWith('.astro'));
}

function walkMd(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walkMd(fullPath) : fullPath;
  }).filter(f => f.endsWith('.md'));
}
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
if (fs.existsSync(beritaDir)) {
  const beritaFiles = walkMd(beritaDir);

  const berita = beritaFiles.map(file => {
    const raw = fs.readFileSync(file, 'utf-8');
    const { data } = matter(raw);
    if (!data.slugId || !data.lang || !data.title) {
      console.warn(`⚠️  Missing slugId/lang/title in berita: ${file}`);
      return null;
    }

    return {
      slugId: data.slugId,
      lang: data.lang,
      title: data.title,
      slug: slugify(data.title),
    };
  }).filter(Boolean);

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

  const newsCount = berita.filter(b => b.lang === 'en').length;
  const perPage = 9;
  const totalPages = Math.ceil(newsCount / perPage);
  for (let i = 1; i <= totalPages; i++) {
    const idPage = `/berita/page/${i}/index.html`;
    const enPage = `/en/news/page/${i}/index.html`;
    map[idPage] = enPage;
    map[enPage] = idPage;
  }

  map['/berita/index.html'] = '/en/news/index.html';
  map['/en/news/index.html'] = '/berita/index.html';
}
if (fs.existsSync(prodiDir)) {
  const prodiFiles = walkMd(prodiDir);

  const prodi = prodiFiles.map(file => {
    const raw = fs.readFileSync(file, 'utf-8');
    const { data } = matter(raw);
    if (!data.slugId || !data.lang || !data.title) {
      console.warn(`⚠️  Missing slugId/lang/title in program-studi: ${file}`);
      return null;
    }

    return {
      lang: data.lang,
      slugId: data.slugId,
      title: data.title,
      slug: path.basename(file, '.md'),
      file,
      menu: data.menu || []
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

    map[`${baseId}/profil/index.html`] = `${baseEn}/profile/index.html`;
    map[`${baseEn}/profile/index.html`] = `${baseId}/profil/index.html`;

    const idMenu = idEntry.menu.filter(m => !m.external);
    const enMenu = enEntry.menu.filter(m => !m.external);
    const allTabs = [...new Set([...idMenu.map(m => m.id), ...enMenu.map(m => m.id)])];

    allTabs.forEach(id => {
      map[`${baseId}/${id}/index.html`] = `${baseEn}/${id}/index.html`;
      map[`${baseEn}/${id}/index.html`] = `${baseId}/${id}/index.html`;
    });
  });
}
const output = `export const slugMap = ${JSON.stringify(map, null, 2)};\n`;
fs.writeFileSync(outputFile, output);
console.log(`[OK] slugMap generated (${Object.keys(map).length} entries)`);

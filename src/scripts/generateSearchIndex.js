import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import slugify from 'slugify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const contentDir = path.join(projectRoot, 'src', 'content');
const output = path.join(projectRoot, 'public', 'search-index.json');

function readMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return readMdFiles(full);
      return full.endsWith('.md') ? [full] : [];
    });
}

function makeSlug(str) {
  return slugify(str, { lower: true, strict: true });
}

const records = [];

// Berita
const beritaDir = path.join(contentDir, 'berita');
readMdFiles(beritaDir).forEach((file) => {
  const raw = fs.readFileSync(file, 'utf-8');
  const { data } = matter(raw);
  if (!data?.title || !data?.lang) return;
  const slug = data.slug ? String(data.slug) : makeSlug(data.title);
  const url = `/${data.lang === 'en' ? 'en/news' : 'berita'}/${slug}/index.html`;
  records.push({
    title: data.title,
    url,
    description: data.description || data.excerpt || '',
    type: data.lang === 'en' ? 'News' : 'Berita',
    lang: data.lang,
  });
});

// Program Studi
const prodiDir = path.join(contentDir, 'program-studi');
readMdFiles(prodiDir).forEach((file) => {
  const raw = fs.readFileSync(file, 'utf-8');
  const { data } = matter(raw);
  if (!data?.title || !data?.lang) return;
  const slug = data.slug ? String(data.slug) : path.basename(file, '.md');
  const base = data.lang === 'en' ? '/en/study-programs' : '/program-studi';
  records.push({
    title: data.title,
    url: `${base}/${slug}/profil/index.html`,
    description: data.description || data.subtitle || '',
    type: data.lang === 'en' ? 'Study Program' : 'Program Studi',
    lang: data.lang,
  });
});

fs.writeFileSync(output, JSON.stringify(records, null, 2));
console.log(`[search] index generated: ${records.length} items -> ${output}`);

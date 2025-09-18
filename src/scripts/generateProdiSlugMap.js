import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { tabIdMapIdToEn, tabIdMapEnToId } from '../src/utils/tabIdMap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prodiDir = path.resolve(__dirname, '../src/content/program-studi');
const outFile  = path.resolve(__dirname, '../src/utils/i18nProdiSlugMap.js');

function walkMd(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(e => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walkMd(full) : full;
    })
    .filter(f => f.endsWith('.md'));
}

const files = walkMd(prodiDir);
const items = files.map(f => {
  const raw = fs.readFileSync(f, 'utf-8');
  const { data } = matter(raw);
  if (!data?.slugId || !data?.lang) {
    console.warn('⚠️  Missing slugId/lang in', f);
    return null;
  }
  const fileSlug = path.basename(f, '.md');   // default pakai nama file
  const slug     = data.slug ? String(data.slug) : fileSlug;
  return {
    slugId: String(data.slugId),
    lang: String(data.lang),
    slug,
    menu: (data.menu || []).filter(m => !m.external),
    // opsi override per-prodi (lihat Bagian #4)
    idToEn: data?.i18n?.idToEn || null,
    enToId: data?.i18n?.enToId || null,
  };
}).filter(Boolean);

// kelompokkan per slugId
const byId = new Map();
for (const it of items) {
  if (!byId.has(it.slugId)) byId.set(it.slugId, {});
  byId.get(it.slugId)[it.lang] = it;
}

const map = {};

for (const [slugId, pair] of byId.entries()) {
  const id = pair.id, en = pair.en;
  if (!id || !en) {
    console.warn('⚠️  Missing pair for slugId:', slugId);
    continue;
  }

  const baseId = `/program-studi/${id.slug}`;
  const baseEn = `/en/study-programs/${en.slug}`;

  // profil ↔ profile tetap eksplisit
  map[`${baseId}/profil/index.html`]  = `${baseEn}/profile/index.html`;
  map[`${baseEn}/profile/index.html`] = `${baseId}/profil/index.html`;

  // siapkan kamus tab:
  // prioritas: override per-prodi → global map → identik
  const localIdToEn = { ...(id.idToEn || {}), ...tabIdMapIdToEn };
  const localEnToId = { ...(en.enToId || {}), ...tabIdMapEnToId };

  // daftar tab (unik)
  const idTabs = new Set(id.menu.map(m => m.id));
  const enTabs = new Set(en.menu.map(m => m.id));

  // ID → EN
  for (const idTab of idTabs) {
    const enTab = localIdToEn[idTab] || idTab;
    map[`${baseId}/${idTab}/index.html`] = `${baseEn}/${enTab}/index.html`;
  }
  // EN → ID
  for (const enTab of enTabs) {
    const idTab = localEnToId[enTab] || enTab;
    map[`${baseEn}/${enTab}/index.html`] = `${baseId}/${idTab}/index.html`;
  }
}

fs.writeFileSync(outFile, `export const prodiSlugMap = ${JSON.stringify(map, null, 2)};\n`);
console.log(`[OK] prodiSlugMap generated (${Object.keys(map).length} entries)`);

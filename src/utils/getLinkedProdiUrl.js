import { getCollection } from 'astro:content';
import { tabIdMapIdToEn, tabIdMapEnToId } from './tabIdMap.js';

export async function getLinkedProdiUrl(slugId, targetLang, sectionId, sourceLang = 'id') {
  const all = await getCollection('program-studi');
  const match = all.find(p => p.data.slugId === slugId && p.data.lang === targetLang);
  if (!match) return null;

  const entrySlug = match.data.slug ? String(match.data.slug) : String(match.slug);
  const base = targetLang === 'en' ? '/en/study-programs' : '/program-studi';

  if (!sectionId) return `${base}/${entrySlug}/index.html`;

  let targetSection = sectionId;
  if (sourceLang !== targetLang) {
    targetSection = sourceLang === 'id'
      ? (tabIdMapIdToEn[sectionId] || sectionId)
      : (tabIdMapEnToId[sectionId] || sectionId);
  }
  return `${base}/${entrySlug}/${targetSection}/index.html`;
}

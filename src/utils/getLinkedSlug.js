// src/utils/getLinkedSlug.js
import { getCollection } from 'astro:content';

export async function getLinkedSlug(collection, slugId, targetLang) {
  const allItems = await getCollection(collection);
  const match = allItems.find(p =>
    p.data.slugId === slugId && p.data.lang === targetLang
  );
  return match ? `/${targetLang === 'en' ? 'en/' : ''}${collection === 'berita' ? (targetLang === 'en' ? 'news' : 'berita') : collection}/${match.data.slugId}/index.html` : null;
}
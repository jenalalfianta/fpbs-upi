import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET() {
  const baseUrl = 'https://fpbs.upi.edu';
  const entries = await getCollection('program-studi');

  const urls = entries.flatMap((entry) => {
    const slug = entry.slug;
    const tabs = entry.data.menu?.map(item => item.id) || ['profil'];
    return tabs.map((tab) => `${baseUrl}/program-studi/${slug}/${tab}.html`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}

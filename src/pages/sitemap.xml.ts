export const prerender = true;

export async function GET() {
  const baseUrl = 'https://fpbs.upi.edu';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-0.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-prodi.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}

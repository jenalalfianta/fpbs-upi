import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://fpbs.upi.edu',
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'static',
  build: { format: 'directory' },
  integrations: [sitemap()],
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'id',
    routing: {
      prefixDefaultLocale: false
    }
  }
});

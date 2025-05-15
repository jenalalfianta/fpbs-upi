import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://fpbs.upi.edu', 
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'static',
  build: { format: 'file' },
  integrations: [sitemap()]
});

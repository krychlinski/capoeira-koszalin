// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import obrazkiFacebooka from './integracje/obrazki-fb.mjs';

export default defineConfig({
  // Docelowo capoeira.koszalin.pl — na razie domyślna domena hostingu.
  site: 'https://capoeira-koszalin.netlify.app',
  build: { format: 'directory' },
  integrations: [obrazkiFacebooka(), sitemap({ filter: (strona) => !strona.includes('/admin') })],
});

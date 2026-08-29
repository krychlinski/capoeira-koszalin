// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Docelowo capoeira.koszalin.pl — na razie domyślna domena hostingu.
  site: 'https://capoeira-koszalin.pages.dev',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (strona) => !strona.includes('/admin') })],
});

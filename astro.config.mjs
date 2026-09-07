// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import facebookImages from './integrations/facebook-images.mjs';

export default defineConfig({
  // UWAGA: przy przełączaniu domeny zmień to RAZEM z adresem mapy witryny
  // w public/robots.txt. Stąd biorą się adresy kanoniczne i cała mapa witryny,
  // więc rozjazd każe wyszukiwarkom indeksować nieistniejący serwis.
  site: 'https://www.capoeira.koszalin.pl',
  build: { format: 'directory' },
  integrations: [facebookImages(), sitemap({ filter: (page) => !page.includes('/admin') })],
});

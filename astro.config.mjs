// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import obrazkiFacebooka from './integracje/obrazki-fb.mjs';

export default defineConfig({
  // Docelowo capoeira.koszalin.pl — na razie domyślna domena hostingu.
  // UWAGA: przy przełączaniu domeny zmień to RAZEM z adresem mapy witryny
  // w public/robots.txt. Stąd biorą się adresy kanoniczne i cała mapa witryny,
  // więc rozjazd każe wyszukiwarkom indeksować nieistniejący serwis.
  site: 'https://capoeira-koszalin.kacper-rychlinski.workers.dev',
  build: { format: 'directory' },
  integrations: [obrazkiFacebooka(), sitemap({ filter: (strona) => !strona.includes('/admin') })],
});

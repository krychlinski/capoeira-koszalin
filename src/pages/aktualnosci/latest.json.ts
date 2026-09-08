import type { APIRoute } from 'astro';
import { allNews } from '../../lib/news';

/**
 * Najnowszy wpis w postaci, którą da się przeczytać bez budowania strony.
 *
 * Czytają go dwie rzeczy i obie są poza Astro:
 *  - service worker, po odebraniu pustego powiadomienia push — stąd bierze treść,
 *    dzięki czemu Worker nie musi szyfrować ładunku według RFC 8291;
 *  - GitHub Actions po zbudowaniu — porównuje `id` i tylko przy zmianie woła Worker.
 */
export const GET: APIRoute = async () => {
  const [latest] = await allNews();

  const body = latest
    ? {
        // Adres jest zarazem identyfikatorem: jest niepowtarzalny i nie zmienia się
        // przy przebudowaniu, a data i tytuł potrafią się zmienić po edycji wpisu.
        id: latest.href,
        title: latest.title,
        url: latest.href,
        date: latest.date.toISOString(),
      }
    : null;

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Service worker pyta o ten plik w chwili odebrania powiadomienia. Gdyby
      // wisiał w pamięci podręcznej, pokazałby poprzedni wpis.
      'Cache-Control': 'no-cache',
    },
  });
};

import { createHash } from 'node:crypto';
import type { APIRoute } from 'astro';
import { allNews } from '../../lib/news';

/**
 * Najnowszy wpis plus odcisk całej listy aktualności.
 *
 * Czytają to dwie rzeczy i obie są poza Astro:
 *  - service worker, po odebraniu pustego powiadomienia push — stąd bierze treść,
 *    dzięki czemu Worker nie musi szyfrować ładunku według RFC 8291;
 *  - GitHub Actions po zbudowaniu — porównuje `fingerprint` z tym, który leży już
 *    na produkcji, i wdraża tylko przy różnicy.
 *
 * Po co odcisk: budowanie jest darmowe, wdrożenie nie. Bez tego każde sprawdzenie
 * Facebooka kończyło się wdrożeniem, więc częstsze zaglądanie kosztowało wprost.
 * Teraz koszt zależy od liczby PRAWDZIWYCH zmian, a nie od częstotliwości.
 *
 * Odcisk liczymy z pól, które faktycznie renderujemy. Komentarzy i reakcji nie
 * pobieramy z Facebooka w ogóle, więc nie ma ich czym objąć i nowy komentarz pod
 * postem sam z siebie nie wywoła wdrożenia. To jest powód, dla którego odcisk jest
 * lepszy od filtrowania zdarzeń: nie trzeba pamiętać listy wyjątków.
 */
export const GET: APIRoute = async () => {
  const entries = await allNews();

  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify(
        entries.map((e) => [
          e.href,
          e.title,
          e.date.toISOString(),
          e.images.length,
          // Pełna treść, a nie zajawka — dzięki temu poprawka literówki w środku
          // długiego wpisu też jest zmianą.
          e.fullBody ?? e.excerpt ?? '',
        ])
      )
    )
    .digest('hex');

  const [newest] = entries;
  const body = {
    fingerprint,
    latest: newest
      ? {
          // Adres jest zarazem identyfikatorem: jest niepowtarzalny i nie zmienia się
          // przy przebudowaniu, a data i tytuł potrafią się zmienić po edycji wpisu.
          id: newest.href,
          title: newest.title,
          url: newest.href,
          date: newest.date.toISOString(),
        }
      : null,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Service worker pyta o ten plik w chwili odebrania powiadomienia, a workflow
      // przy każdym budowaniu. Gdyby wisiał w pamięci podręcznej, oba dostałyby
      // poprzedni stan — service worker pokazałby stary wpis, a workflow uznałby
      // prawdziwą zmianę za brak zmiany i nigdy by nie wdrożył.
      'Cache-Control': 'no-cache',
    },
  });
};

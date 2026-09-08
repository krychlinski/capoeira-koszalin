/* Service worker — jedyny nasz kod, który działa, gdy strona jest zamknięta.
 *
 * Leży w public/, więc trafia do korzenia serwisu. To nie jest kosmetyka:
 * service worker obejmuje swoim zasięgiem wyłącznie katalog, w którym leży,
 * a powiadomienia mają działać na całej stronie.
 *
 * Niczego tu nie buforujemy. Strona jest statyczna i szybka, a pamięć podręczna
 * service workera to najczęstsze źródło „dlaczego widzę starą wersję”.
 */

/* Tytuł jest STAŁY, a tekst wpisu idzie w treść — nie odwrotnie.
   Tytuł powiadomienia to jeden wiersz i system ucina go bez litości, a wpisy
   z Facebooka mają pierwszą linię długą nawet na 90 znaków. W treści mieszczą
   się dwa, trzy wiersze, więc tam widać, o co chodzi. */
const TITLE = 'Nowy wpis w aktualnościach';
const FALLBACK = {
  body: 'Otwórz, żeby zobaczyć, co nowego w Akademii.',
  url: '/aktualnosci/',
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  // Powiadomienie przychodzi PUSTE — treść dociągamy sami. Dzięki temu Worker
  // nie musi szyfrować ładunku, co jest najbardziej zawiłą częścią web push.
  event.waitUntil(
    (async () => {
      let data = FALLBACK;
      try {
        const res = await fetch('/aktualnosci/latest.json', { cache: 'no-store' });
        const { latest } = await res.json();
        if (latest?.title) data = { body: latest.title, url: latest.url };
      } catch {
        // Brak sieci albo zły plik — pokazujemy powiadomienie ogólne. Milczenie
        // byłoby gorsze: przeglądarka i tak wymaga, żeby po pushu coś się pojawiło.
      }

      await self.registration.showNotification(TITLE, {
        body: data.body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        // Ten sam tag zastępuje poprzednie powiadomienie zamiast dokładać kolejne.
        tag: 'aktualnosci',
        data: { url: data.url },
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || FALLBACK.url;

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Jeśli strona jest już gdzieś otwarta, przechodzimy w tej karcie zamiast
      // otwierać kolejną — inaczej po kilku powiadomieniach robi się ich las.
      const otwarta = all.find((c) => new URL(c.url).origin === self.location.origin);
      if (otwarta) {
        try {
          await otwarta.navigate(target);
          return otwarta.focus();
        } catch {
          // navigate() działa tylko na kartach kontrolowanych przez tego service
          // workera i rzuca na pozostałych. Bez tego przechwycenia kliknięcie
          // w powiadomienie nie robiło NIC — obietnica cicho odrzucała.
        }
      }
      return self.clients.openWindow(target);
    })()
  );
});

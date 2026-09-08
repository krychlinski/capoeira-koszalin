/* Service worker — jedyny nasz kod, który działa, gdy strona jest zamknięta.
 *
 * Leży w public/, więc trafia do korzenia serwisu. To nie jest kosmetyka:
 * service worker obejmuje swoim zasięgiem wyłącznie katalog, w którym leży,
 * a powiadomienia mają działać na całej stronie.
 *
 * Niczego tu nie buforujemy. Strona jest statyczna i szybka, a pamięć podręczna
 * service workera to najczęstsze źródło „dlaczego widzę starą wersję”.
 */

const FALLBACK = {
  title: 'Akademia Capoeira Koszalin',
  body: 'Pojawił się nowy wpis w aktualnościach.',
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
        const latest = await res.json();
        if (latest?.title) {
          data = { title: latest.title, body: 'Nowy wpis w aktualnościach', url: latest.url };
        }
      } catch {
        // Brak sieci albo zły plik — pokazujemy powiadomienie ogólne. Milczenie
        // byłoby gorsze: przeglądarka i tak wymaga, żeby po pushu coś się pojawiło.
      }

      await self.registration.showNotification(data.title, {
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
      for (const client of all) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })()
  );
});

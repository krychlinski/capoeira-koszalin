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
        // Doklejony znacznik czasu, a nie sam { cache: 'no-store' }. Zaobserwowane
        // 2026-09-08: brzeg Cloudflare potrafi przez kilka minut po wdrożeniu
        // podawać starą treść mimo Cache-Control: no-cache, a żądanie z dodatkowym
        // parametrem dostawało świeżą. Bez tego powiadomienie o nowym wpisie
        // pokazywałoby czasem tytuł POPRZEDNIEGO — losowo i bez śladu w logach,
        // bo każdy węzeł brzegowy odświeża się osobno.
        const res = await fetch('/aktualnosci/latest.json?t=' + Date.now(), { cache: 'no-store' });
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

      // Karta stojąca już na tym wpisie — wystarczy ją wysunąć na wierzch.
      const naMiejscu = all.find((c) => {
        try {
          return new URL(c.url).pathname === target;
        } catch {
          return false;
        }
      });
      if (naMiejscu) return naMiejscu.focus();

      // W każdym innym wypadku OTWIERAMY NOWĄ KARTĘ, zamiast przestawiać
      // istniejącą przez navigate(). Ta metoda zawiodła dwa razy z rzędu:
      // rzuca na kartach, których ten service worker nie kontroluje, a gdy już
      // zadziała, przestawia kartę w tle — z perspektywy klikającego
      // powiadomienie po prostu znika i nic się nie dzieje. Nowa karta jest
      // przewidywalna: zawsze widać skutek kliknięcia.
      const nowa = await self.clients.openWindow(target);
      // Samo otwarcie karty nie prosi systemu o wysunięcie przeglądarki na
      // wierzch — w Safari na macOS strona otwierała się poprawnie, ale dopiero
      // po ręcznym przełączeniu się na przeglądarkę było to widać.
      // Czy system posłucha, zależy już od niego; my mamy o to poprosić.
      if (nowa) await nowa.focus().catch(() => {});
      return nowa;
    })()
  );
});

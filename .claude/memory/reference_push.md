---
name: reference-push
description: Powiadomienia push o nowych aktualnościach — Worker, klucze VAPID, sztuczka z pustym ładunkiem, ograniczenie iOS
metadata:
  type: reference
---

Uruchomione 2026-09-08. Dzwoneczek na `/aktualnosci/` zapisuje przeglądarkę, a po każdym
budowaniu GitHub Actions rozgłasza nowy wpis.

## Dlaczego w ogóle jest tu backend

Powiadomienie musi wyjść w chwili pojawienia się wpisu — wtedy przeglądarka odbiorcy jest
zamknięta i nasza strona nigdzie nie działa. Ktoś musi trzymać subskrypcje i podpisać żądanie
do serwerów Google/Mozilli/Apple. **Statyczna strona tego nie zrobi. To ograniczenie protokołu,
nie brak pomysłu** — nie szukaj obejścia, nie ma go.

Wybrano Cloudflare Worker + KV, bo nie ma systemu, CMS-a ani aktualizacji bezpieczeństwa,
więc nie wprowadza bieżni z łataniem, od której ucieka [[decision-nie-wordpress]].

To NIE jest ten sam Worker, który kiedyś odpadł. Tamten miał serwować stronę pod własną domeną
i nie przyjmował jej z obcego DNS-u [[reference-hosting]]. Ten jest tylko API pod adresem
`workers.dev`, więc problem go nie dotyczy.

## Co gdzie leży

- `worker/` — kod Workera i jego `wrangler.jsonc`. **Osobny od tego w korzeniu repozytorium**,
  który opisuje stronę na Pages. Wdrożenie: `cd worker && npx wrangler deploy`.
- `capoeira-push.kacper-rychlinski.workers.dev` — trasy `/subscribe`, `/unsubscribe`,
  `/notify`, `/health`.
- KV `SUBS` — subskrypcje pod `sub:<skrót adresu>` plus `state:last-post`.
- `public/sw.js` — service worker. Musi leżeć w korzeniu, bo obejmuje tylko swój katalog.
- `src/components/NewsBell.astro` — dzwoneczek.
- `src/pages/aktualnosci/latest.json.ts` — najnowszy wpis dla service workera i dla workflow.

## Sztuczka: powiadomienia bez treści

Prawdziwy ładunek trzeba szyfrować według RFC 8291 (aes128gcm, wymiana kluczy) i to najbardziej
zawiła część protokołu. **Wysyłamy powiadomienia puste**, a service worker po odebraniu sam
dociąga `/aktualnosci/latest.json`. Zostaje samo podpisywanie VAPID, które Web Crypto robi
natywnie — cała warstwa szyfrowania znika.

Skutek uboczny, korzystny: nie potrzebujemy kluczy szyfrujących z subskrypcji, więc dzwoneczek
wysyła **wyłącznie adres endpointu**. Nie mamy czego stracić przy wycieku.

## Sekrety

- `VAPID_PRIVATE_JWK` i `NOTIFY_SECRET` — sekrety Workera, wpisane przez `wrangler secret put`.
- `NOTIFY_SECRET` także w sekretach repozytorium, workflow woła nim `/notify`.
- Klucz publiczny VAPID jest **jawny z założenia** i siedzi wprost w `NewsBell.astro`
  oraz w `worker/wrangler.jsonc`. Przeglądarka musi go dostać, żeby się zapisać.
- Kopia pary kluczy leży w `.vapid.json`, w `.gitignore`. **Nie kasuj jej bezmyślnie:**
  zmiana klucza VAPID unieważnia wszystkie istniejące subskrypcje.

## Jak to przetestować bez prawdziwej subskrypcji

Zapisz atrapę na PRAWDZIWYM adresie FCM ze zmyślonym tokenem i wywołaj `/notify`. Google
najpierw sprawdza podpis VAPID, a dopiero potem token, więc odpowiedź rozróżnia przyczynę:

- `401`/`403` — **podpis jest zły**;
- `404`/`410` — podpis dobry, nieznany tylko token. Tego oczekujemy.

Tak zweryfikowano podpisywanie 2026-09-08 (wynik `{"wygasła":1}`). Worker kasuje przy okazji
subskrypcje z 404/410, więc atrapa sprząta się sama.

## Odcisk: budujemy zawsze, wdrażamy tylko przy zmianie

Budowanie jest darmowe (Actions w publicznym repo), **wdrożenie zużywa limit Cloudflare**.
Bez rozdzielenia tych dwóch rzeczy częstsze zaglądanie do Facebooka kosztowałoby wprost:
harmonogram co godzinę to ~580 wdrożeń miesięcznie przy sufcie rzędu 500.

`/aktualnosci/latest.json` niesie więc `fingerprint` — skrót z pól, które FAKTYCZNIE renderujemy
(adres, tytuł, data, liczba zdjęć, pełna treść każdego wpisu). Workflow porównuje świeży odcisk
z tym leżącym na produkcji i przy równości kończy bez wdrożenia i bez powiadomienia. Wdrożeń jest
tyle, ile prawdziwych zmian — kilka miesięcznie zamiast kilkuset.

**Dlaczego odcisk, a nie filtrowanie zdarzeń:** komentarz pod postem nie rusza żadnego z tych pól,
bo komentarzy w ogóle nie pobieramy z Graph API. Nie trzeba więc pamiętać listy wyjątków —
z definicji reaguje tylko to, co widać na stronie.

Sprawdzenie działa **tylko przy uruchomieniu z harmonogramu**. Wypchnięcie zmiany i przycisk
„Run workflow" wdrażają zawsze, bo tam zmiana może siedzieć w szacie albo w treści z panelu,
czyli poza odciskiem aktualności. Gdy produkcja jest nieosiągalna albo nie ma jeszcze odcisku —
wdrażamy; przy wątpliwości lepiej wdrożyć niepotrzebnie niż przegapić wpis.

Odcisk musi być **stabilny**: dwa czyste budowania bez zmian w treści dają ten sam skrót
(sprawdzone). Gdyby się chwiał, wdrażałoby się zawsze i cała rzecz nie miałaby sensu.

**Pułapka, na którą się nadziałem:** `Cache-Control` ustawiony w kodzie endpointu nic tu nie daje.
Przy budowaniu statycznym to zwykły plik na dysku, a nagłówki nadaje hosting — trzeba je wpisać
w `public/_headers`. Buforowana kopia `latest.json` byłaby podwójnie zdradliwa: service worker
pokazywałby poprzedni wpis, a workflow uznawałby prawdziwą zmianę za brak zmiany i **nigdy by
nie wdrożył**.

## Kolejność w workflow ma znaczenie

Krok „Rozgłoś nowy wpis" idzie **po** wdrożeniu. Powiadomienie jest puste, więc service worker
dociąga treść z sieci — rozgłoszenie przed wdrożeniem wysłałoby ludzi po poprzedni wpis.

Wołamy przy każdym budowaniu, także gdy nic się nie zmieniło; Worker pamięta ostatni rozesłany
wpis w `state:last-post` i pomija powtórki. Bez tego znacznika ten sam post szedłby w świat
co trzy godziny.

## Ograniczenia, które trzeba znać

- **iPhone: tylko po dodaniu do ekranu głównego.** Safari nie dostarcza push w zwykłej karcie.
  Stąd `public/site.webmanifest` i `display: standalone` — bez manifestu nie da się tego nawet
  spróbować. Dzwoneczek wykrywa ten przypadek i zamiast znikać, tłumaczy, co zrobić.
- **Opóźnienie do godziny w dzień, do trzech w nocy.** Harmonogram: `7 4-20 * * *`
  i `7 23,2 * * *` (UTC), czyli co godzinę 6:07–22:07 czasu polskiego i dwa razy w nocy.
  Minuta 7, bo o pełnej godzinie zaplanowane workflow czekają u GitHuba w kolejce najdłużej.
  Zimą wszystko przesuwa się o godzinę wcześniej — GitHub nie zna stref czasowych.
- **Webhook Mety świadomie odrzucony** (2026-09-08). Kupowałby godzinę, a kosztował zależność
  od Mety, przegląd aplikacji i filtrowanie zdarzeń. Kacper uznał, że godzina opóźnienia nic
  nie psuje. Nie wracać bez wyraźnej potrzeby.
- `/prywatnosc/` została przepisana i opisuje ten stan. **Każda zmiana w tym, co przechowujemy,
  wymaga poprawienia tamtej strony** — tak samo jak przy wtyczce Facebooka.

Powiązane: [[status]], [[project-formatowanie-fb]]

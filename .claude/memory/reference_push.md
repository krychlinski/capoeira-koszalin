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

## Kolejność w workflow ma znaczenie — i samo „po wdrożeniu" nie wystarcza

Krok „Rozgłoś nowy wpis" idzie **po** wdrożeniu. Powiadomienie jest puste, więc service worker
dociąga treść z sieci — rozgłoszenie przed wdrożeniem wysłałoby ludzi po poprzedni wpis.

**Ale wdrożenie nie znaczy jeszcze, że produkcja podaje nową wersję.** Zaobserwowane
2026-09-08: przez około dwie minuty po udanym wdrożeniu `www.capoeira.koszalin.pl/sw.js`
zwracał starą treść, mimo że w Cloudflare leżała już nowa (żądanie z doklejonym parametrem
podawało świeżą). To nieodświeżona kopia na brzegu i `Cache-Control: no-cache` jej nie wyklucza.

Gdyby rozgłoszenie trafiło w to okno, service worker dociągnąłby stary `latest.json`
i pokazał **poprzedni wpis**. Objaw byłby losowy i nie zostawiałby śladu w logach.

Dlatego krok odpytuje produkcję (do 2 minut), aż poda dokładnie ten odcisk, który przed chwilą
zbudowaliśmy, i dopiero wtedy woła Worker.

**Ten krok nie jest bramkowany decyzją o wdrożeniu** i to jest celowe. Gdy produkcja nie zdąży,
kończymy bez rozgłaszania, a zrobi to kolejne budowanie — Worker i tak pomija powtórki po dacie.
Gdyby krok był bramkowany, powiadomienie przepadłoby na zawsze: przy następnym budowaniu odciski
już by się zgadzały, więc nie byłoby wdrożenia, a razem z nim rozgłoszenia.

Wołamy przy każdym budowaniu; Worker pamięta ostatni rozesłany wpis w `state:last-post`
i pomija powtórki. Bez tego znacznika ten sam post szedłby w świat co godzinę.

**Porównujemy DATĘ, nie identyfikator.** Pierwsza wersja porównywała adres wpisu i miała przez to
usterkę: gdy ktoś **skasuje** post na Facebooku, najnowszym staje się z powrotem poprzedni.
Jego adres różni się od zapamiętanego, więc Worker uznawał to za nowość i rozsyłał powiadomienie
**o starym wpisie**. Data nie da się na to nabrać — cofnięcie się w czasie nigdy nie jest nowym
wpisem. Przy okazji edycja starego wpisu też nie powiadamia: treść się zmienia, data nie.

Sprawdzone na żywym Workerze (2026-09-08) w czterech przypadkach: nowy wpis wysyła, ten sam
pomija, **starszy po skasowaniu pomija**, prawdziwie nowszy wysyła.

**Po testach trzeba wyczyścić `state:last-post`**, inaczej zostaje w nim data z przyszłości
i dusi prawdziwe powiadomienia. Zaszczepia się go obecnym najnowszym wpisem:
`wrangler kv key put "state:last-post" "$(jq -c '{id: .latest.id, date: .latest.date}' dist/aktualnosci/latest.json)" --namespace-id <id> --remote`

**Świadome zachowanie:** gdy między budowaniami pojawią się DWA wpisy, powiadomienie idzie
jedno — o nowszym. Starszy nie dostaje własnego. Kacper uznał to za w porządku (2026-09-08);
i tak wspólny `tag` sprawiłby, że drugie powiadomienie podmieniłoby pierwsze na ekranie.

## Jak wygląda powiadomienie i jak je testować ręcznie

Tytuł jest **stały** („Nowy wpis w aktualnościach"), a tekst wpisu idzie w **treść**. Odwrotnie
było źle: tytuł to jeden wiersz i system ucina go bez litości, a pierwsza linia wpisu
z Facebooka bywa długa na 90 znaków (Malandro pisze rozbudowane wstępy). W treści mieszczą się
dwa, trzy wiersze.

Na macOS ikoną powiadomienia jest **ikona przeglądarki**, nie nasz znak — system to nadpisuje
i nic z tym nie zrobimy. Na Chrome i Androidzie nasza ikona się pojawia.

Ręczny strzał (sekret leży w `.notify-secret`, w `.gitignore`):

```
W=https://capoeira-push.kacper-rychlinski.workers.dev
PRZED=$(curl -s $W/health | python3 -c "import sys,json;print(json.dumps(json.load(sys.stdin)['ostatniWpis']))")
curl -s -X POST -H 'Content-Type: application/json' -H "X-Notify-Secret: $(cat .notify-secret)" \
  -d "{\"id\":\"/test/\",\"date\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}" $W/notify
```

**Zawsze przywróć potem `state:last-post` do wartości `$PRZED`** — inaczej zostaje w nim data
z chwili testu i dusi prawdziwe powiadomienia jako „starsze".

## Kliknięcie w powiadomienie — trzy podejścia, dwa błędne

1. `navigate()` na istniejącej karcie. **Rzuca** na kartach, których ten service worker nie
   kontroluje, a rzucało wewnątrz `waitUntil`, więc obietnica cicho odrzucała i kliknięcie
   nie robiło NIC.
2. `navigate()` z przechwyceniem wyjątku. Gdy zadziała, przestawia kartę **w tle** — z
   perspektywy klikającego powiadomienie po prostu znika. Objaw identyczny jak przy błędzie,
   więc nie do odróżnienia bez konsoli.
3. **Działa:** karta stojąca już na tym wpisie zostaje wysunięta na wierzch, w każdym innym
   wypadku `openWindow()` **plus `focus()` na zwróconym oknie**. Bez tego `focus()` Safari na
   macOS otwierał kartę, ale nie wychodził na wierzch i wyglądało to na brak reakcji.

Sprawdzone na żywo w Safari 2026-09-08: powiadomienie przychodzi, kliknięcie otwiera wpis
i przeglądarka sama wychodzi na wierzch.

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

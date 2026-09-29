---
name: project-formatowanie-fb
description: Posty z FB — kiedy się pobierają, jak powstaje wypunktowanie i polskie cudzysłowy
metadata:
  type: project
---

## Facebook odpytywany jest RAZ, przy starcie

`fetchPosts()` w `lib/facebook.ts` zapamiętuje wynik w pamięci procesu, a integracja
`integrations/facebook-media.mjs` chodzi na `astro:build:start` i `astro:server:start`. Nowy post **nie pojawi
się** ani na działającym serwerze deweloperskim, ani na produkcji, dopóki nie nastąpi kolejne
budowanie. To nie usterka — pytanie „czemu nie widać nowego wpisu" ma zwykle tę odpowiedź.

## Jak często odświeżamy (ustalone 2026-09-05)

Pierwotnie co trzy godziny, później zagęszczone. `.github/workflows/wdroz.yml` buduje
**co godzinę w dzień i dwa razy w nocy** (`7 4-20 * * *` i `7 23,2 * * *` UTC), a **wdraża
tylko wtedy, gdy odcisk aktualności różni się od produkcji**. Deploy hooka nie ma — harmonogram
i budowanie są w jednym miejscu, patrz [[reference-hosting]]. Minuty GitHub Actions
w repozytorium publicznym są darmowe, a Cloudflare nic nie buduje.

**Przycisk „odśwież" na stronie został odrzucony.** Adres deploy hooka jest jak hasło; w kodzie
strony byłby widoczny dla każdego, a hash hasła obok niczego nie chroni — wystarczy pominąć
przycisk i wywołać hook wprost. Pilne przebudowanie robi się na GitHubie: Actions → „Zbuduj
i wdróż” → Run workflow (Cloudflare nic nie buduje, więc tam nie ma czego klikać). Nie proponuj tego przycisku ponownie bez funkcji
serwerowej trzymającej sekret po swojej stronie.

## Wypunktowanie w postach

Klub pisze plany zajęć gwiazdkami i myślnikami — Facebook nie ma formatowania.
`lib/blocks.ts` (`toBlocks`) rozpoznaje `*`, `•`, `-`, `1.`, `1)`. Gwiazdka działa też bez spacji
(`*7-12 lat`), myślnik wymaga spacji, żeby nie łapać `-18.30`.

Myślnik pod pozycją z gwiazdki/numeru = lista zagnieżdżona (tak zapisany jest plan: dzień
gwiazdką, grupy pod nim). Ciąg samych myślników = jedna płaska lista. Pierwsza wersja wcinała
tam wszystko pod pierwszą pozycją i było to bez sensu.

`toBlocks` zwraca **dane, nie HTML** — strona buduje z nich listy sama. Znacznik wklejony na
Facebooku trafi na stronę jako widoczny tekst, a nie jako kod. Nie zamieniaj tego na sklejanie
stringów z `set:html`.

Kafle wpisów pokazują listę, gdy wpis się nią **zaczyna**: cztery pierwsze pozycje, każda
skrócona do 70 znaków. `splitTitle()` w `facebook.ts` zdziera znaczniki **tylko z tytułu** —
wcześniej zdzierało ze wszystkich wierszy i do kafla docierał tekst, w którym nie dało się
już rozpoznać listy.

## Polskie cudzysłowy

Markdown przechodzi przez smartypants, który podnosi proste cudzysłowy po **angielsku**
(“tekst”, oba u góry). Zamiana na dolno-górne „tekst” siedzi w `lib/typography.ts`
(`fixQuotes`, wołane z `applyTypography` w `src/middleware.ts`) i działa na gotowym HTML-u razem z regułą sierotek — obejmuje więc treść
z panelu, posty z Facebooka i teksty z komponentów naraz.

Ograniczenie: para prostych cudzysłowów musi zmieścić się w jednym kawałku tekstu między
znacznikami. Otwarcie przed pogrubieniem i zamknięcie po nim zostanie proste.

Powiązane: [[todo-facebook-api]]

## Udostępnienie cudzego postu przepada — i to nie jest nasza usterka

Zbadane 2026-09-29. Malandro napisał post w grupie Akademii, a strona klubu go udostępniła:
dwie grafiki i długi tekst o nowych grupach. Na Facebooku wygląda normalnie, na stronie
nie pojawił się w ogóle, więc nie poszło też powiadomienie.

Reguła jest prostsza, niż się wydaje: **czytamy wyłącznie własne posty strony** (`/{page}/posts`).
Cokolwiek powstało poza nią — w grupie, na prywatnym profilu — jest dla nas nieczytelne,
nawet gdy strona to udostępni.

Co Graph API oddaje dla takiego udostępnienia:

- `message` — **nie ma tego pola w ogóle** (klub nie dopisał nic od siebie);
- załącznik typu `native_templates` z tytułem „Zawartość nie jest teraz dostępna";
- `full_picture` — **jest**, jedna z grafik udostępnionego postu;
- `parent_id` — jest, ale pobranie rodzica kończy się błędem uprawnień
  **zarówno tokenem strony, jak i użytkownika**. Tak samo odbija się pytanie o sam obiekt
  nadrzędny, więc API nie mówi nawet, czy to grupa, czy profil. Dostępu do treści grup
  Facebook aplikacjom praktycznie nie daje i nie da się tego obejść uprawnieniem.

Czyli: **tekstu takiego postu nie da się odzyskać.** Maksimum, co możemy z niego wyciągnąć,
to jeden obrazek bez ani jednego słowa.

Wniosek praktyczny dla klubu: ogłoszenia mają być publikowane **jako strona**. Jeśli mają
trafić i do grupy, kolejność jest odwrotna niż tym razem — najpierw post strony, potem
udostępnienie go do grupy.

Gdyby klub dopisał przy udostępnianiu choć jedno zdanie, post BY się pojawił (jest `message`),
ale bez obrazka — `imageUrls()` bierze tylko typy `photo` i `album`, a tu jest
`native_templates`. Dodanie `full_picture` jako awaryjnego źródła dla tego typu to drobna
zmiana, gdyby okazała się potrzebna.

W 60 dniach takich postów bez własnej treści było 7 na 34.

Powiązane: [[reference-push]], [[todo-facebook-api]]

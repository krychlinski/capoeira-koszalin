---
name: project-formatowanie-fb
description: Posty z FB — kiedy się pobierają, jak powstaje wypunktowanie i polskie cudzysłowy
metadata:
  type: project
---

## Facebook odpytywany jest RAZ, przy starcie

`pobierzPosty()` w `lib/facebook.ts` zapamiętuje wynik w pamięci procesu, a integracja
`obrazki-fb.mjs` chodzi na `astro:build:start` i `astro:server:start`. Nowy post **nie pojawi
się** ani na działającym serwerze deweloperskim, ani na produkcji, dopóki nie nastąpi kolejne
budowanie. To nie usterka — pytanie „czemu nie widać nowego wpisu" ma zwykle tę odpowiedź.

## Jak często odświeżamy (ustalone 2026-09-05)

`.github/workflows/wdroz.yml` buduje i wdraża **co trzy godziny**, `cron: 0 */3 * * *` UTC.
Deploy hooka nie ma — harmonogram i budowanie są w jednym miejscu, patrz [[reference-hosting]].
Minuty GitHub Actions w repozytorium publicznym są darmowe, a Cloudflare nic nie buduje, więc
częstotliwość nie zjada żadnego limitu. Można ją podnieść, jeśli trzy godziny okażą się za dużo.

**Przycisk „odśwież" na stronie został odrzucony.** Adres deploy hooka jest jak hasło; w kodzie
strony byłby widoczny dla każdego, a hash hasła obok niczego nie chroni — wystarczy pominąć
przycisk i wywołać hook wprost. Zamiast tego Michał dostanie dostęp do Cloudflare i tam kliknie
przebudowanie, gdy będzie wielka potrzeba. Nie proponuj tego przycisku ponownie bez funkcji
serwerowej trzymającej sekret po swojej stronie.

## Wypunktowanie w postach

Klub pisze plany zajęć gwiazdkami i myślnikami — Facebook nie ma formatowania.
`lib/tresc.ts` (`naBloki`) rozpoznaje `*`, `•`, `-`, `1.`, `1)`. Gwiazdka działa też bez spacji
(`*7-12 lat`), myślnik wymaga spacji, żeby nie łapać `-18.30`.

Myślnik pod pozycją z gwiazdki/numeru = lista zagnieżdżona (tak zapisany jest plan: dzień
gwiazdką, grupy pod nim). Ciąg samych myślników = jedna płaska lista. Pierwsza wersja wcinała
tam wszystko pod pierwszą pozycją i było to bez sensu.

`naBloki` zwraca **dane, nie HTML** — strona buduje z nich listy sama. Znacznik wklejony na
Facebooku trafi na stronę jako widoczny tekst, a nie jako kod. Nie zamieniaj tego na sklejanie
stringów z `set:html`.

Kafle wpisów pokazują listę, gdy wpis się nią **zaczyna**: cztery pierwsze pozycje, każda
skrócona do 70 znaków. `rozbij()` w `facebook.ts` zdziera znaczniki **tylko z tytułu** —
wcześniej zdzierało ze wszystkich wierszy i do kafla docierał tekst, w którym nie dało się
już rozpoznać listy.

## Polskie cudzysłowy

Markdown przechodzi przez smartypants, który podnosi proste cudzysłowy po **angielsku**
(“tekst”, oba u góry). Zamiana na dolno-górne „tekst” siedzi w `lib/typografia.ts`
(`cudzyslowy`) i działa na gotowym HTML-u razem z regułą sierotek — obejmuje więc treść
z panelu, posty z Facebooka i teksty z komponentów naraz.

Ograniczenie: para prostych cudzysłowów musi zmieścić się w jednym kawałku tekstu między
znacznikami. Otwarcie przed pogrubieniem i zamknięcie po nim zostanie proste.

Powiązane: [[todo-facebook-api]]

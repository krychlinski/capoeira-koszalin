---
name: reference-mapka
description: Mapka dojazdu jest statycznym obrazkiem z kafelków OSM — jak ją odtworzyć i dlaczego nie ma tam iframe'a
metadata:
  type: reference
---

Adres Akademii: **Karola Szymanowskiego 16B, Koszalin**, `54.1928644, 16.2033188`.
Podał go Malandro 2026-09-08 linkiem do Map Google, potwierdzony niezależnie w OpenStreetMap.
Kod pocztowy jest **niepewny**: Google podaje 75-564, OSM 75-547. Na stronie stoi wersja Google'a
— do potwierdzenia u Michała.

## Dlaczego obrazek, a nie osadzona mapa

Strona nie ładuje **nic** z zewnątrz poza Google Fonts, a `/prywatnosc/` mówi to wprost:
„nie osadzamy wtyczek… dopiero gdy klikniesz", „nie ma na co zbierać zgód". Iframe Map Google
to ciasteczka Google przy każdym wejściu i konieczność przepisania tamtej strony — dokładnie
ten sam problem, przez który wyleciała wtyczka Facebooka.

Dlatego kafelki pobierane są **raz, ręcznie**, a wynik leży w repozytorium.

## Jak odtworzyć po zmianie adresu

```
python3 scripts/render-map.py
```

Współrzędne, przybliżenie i rozmiar są na górze skryptu. **Zoom 18**, nie 17 — przy 17 nazwy
ulic były za drobne. Kadr to 391 x 266 m, czyli tyle, żeby się zorientować; dalszą nawigację
i tak przejmują Mapy Google po kliknięciu. Kafelki lądują w katalogu tymczasowym,
więc dobieranie tonów nie oznacza ściągania ich od nowa — polityka OSM zabrania hurtu.

## Mapy NIE przemalowujemy na ciemno — i dlaczego

Pierwsze dwa podejścia próbowały zrobić z jasnych kafelków OSM ciemną mapę. Oba były błędne
i warto wiedzieć czemu, bo pomysł wraca sam.

1. **Sama krzywa jasności.** Napisy w kafelkach OSM są **czarne**, więc mapowanie
   „ciemne → najciemniejsze" wypycha nazwy ulic do koloru tła i znikają. Mapka ładna,
   bezużyteczna.
2. **Krzywa plus wyciąganie tekstu osobną maską.** Nazwy wróciły, ale rozmyte. Powód jest
   nie do obejścia: tekst w OSM ma **białą obwódkę** (`text-halo`) i to ona daje mu czytelność
   na jasnym tle. Przemalowanie zamienia obwódkę w **najjaśniejszy ton całej mapy**, więc jasna
   litera świeci na prawie równie jasnej plamie. Im mocniej wyciągasz tekst, tym mocniej
   wyciągasz też jego obwódkę. Progami się tego nie naprawi.

**Wniosek: nie walcz z rastrem narysowanym pod jasne tło.** Kafelki zostają w oryginalnych
kolorach, skrypt tylko **przygasza je w całości** i lekko podbija nasycenie.

Przygaszenie w całości jest dla tekstu bezpieczne — czerń liter zostaje czernią, a biała
obwódka schodzi do szarości, więc kontrast się utrzymuje. Zmierzone: przy `BRIGHTNESS = 0.62`
napis ma jeszcze ~8:1, przy 0.46 spada do ~4,5:1 i robi się męczący. Stanęło na 0.62 —
średnia jasność mapki 136 wobec 221 w surowym kafelku.

Skutek uboczny: mapka jest **jaśniejsza od reszty strony** i czyta się jak wklejka. To była
świadoma zamiana — czytelne nazwy ulic za jednolitość szaty.

## Mapa jest KADROWANA, nie ściskana

Najdłużej żyjący błąd w tej mapce: obrazek był rozciągany do szerokości kontenera
(`object-fit: cover` plus `width: 100%`). Na telefonie kontener ma ~490 px, obrazek miał 1120,
więc szedł w dół o 56% — **razem z napisami narysowanymi w kafelkach**. Nazwy ulic schodziły
z 11 px do 5 px i znikały. Pinezka, mająca sztywny rozmiar w px CSS, zostawała duża i wyglądało
to, jakby to ona urosła. Objaw myli: wygląda na problem z pinezką, jest z obrazkiem.

Teraz `object-fit: none` — piksel obrazka odpowiada pikselowi CSS. Nazwy ulic mają wszędzie
tę samą wielkość, a wąski ekran po prostu pokazuje **mniejszy wycinek okolicy**, dokładnie tak
jak zachowuje się każda prawdziwa mapa. Zasięg: ~300 x 207 m na desktopie, ~136 x 182 m
na telefonie (tam kadr jest pionowy).

**Obrazek musi mieć JEDEN rozmiar** — `widths={[1400]}`. Gdyby Astro wygenerowało srcset,
przeglądarka wybrałaby na telefonie wariant 560 px, w którym cała mapa jest już wciśnięta
w 560 px, i skala znowu by się rozjechała.

Napisy w kafelkach mają na sztywno ~11 px i **nie da się ich powiększyć u źródła** — OSM rysuje
je tak samo na każdym przybliżeniu, więc większy zoom daje mniej terenu, a nie większe litery.
Jedyny sposób to powiększenie rastra: `SCALE = 1.25` plus lekkie wyostrzenie. Mocniejsze
zaczyna rozmywać litery.

## CARTO odpada — wymaga klucza API

`basemaps.cartocdn.com/dark_all` to gotowe ciemne kafelki z jasnymi napisami i dokładnie
rozwiązywałyby problem. **Od pewnego czasu zwracają kafelki ze znakiem wodnym
„API KEY REQUIRED"** (sprawdzone 2026-09-08). Trzeba by założyć konto — czyli dokładnie ta
zależność od cudzej usługi, od której projekt ucieka. Gdyby ktoś kiedyś to konto założył,
`dark_all` jest właściwym stylem.

## Pinezka nie jest w obrazku

Rysuje ją `Map.astro` jako SVG, bo bierze wtedy kolor wprost z `--accent` i jest ostra w każdej
skali. Siedzi na sztywno w środku kadru (`left/top: 50%`, czubek przez `translate(-50%, -100%)`),
bo skrypt kadruje obrazek **dokładnie na współrzędnych**. Podmiana samego `mapUrl` w ustawieniach
przesunie tylko cel kliknięcia, nie kadr — obrazek trzeba wyrenderować od nowa.

Kolory idą przez CSS, nie przez `fill="var(--accent)"` w atrybucie SVG — `var()` w atrybucie
prezentacyjnym nie działa w każdej przeglądarce.

**Pułapka: obrys przycięty przez viewBox.** Ścieżka pinezki zajmuje dokładnie `0 0 24 32`,
czyli dotyka wszystkich czterech krawędzi. `stroke-width: 2` wychodzi jednostkę poza ścieżkę
i SVG obcina go domyślnie — obwódka robi się urwana od góry i boków, a wygląda to jak zła
ścieżka, nie jak przycięcie. Poszerzenie viewBoxa **nie wchodzi w grę**, bo czubek musi zostać
w rogu kadru, żeby `translate(-50%, -100%)` trafiał w punkt. Rozwiązanie: `overflow: visible`
na samym `<svg>`.

Pod czubkiem była przez chwilę osobna kropka „dokładnego punktu" — dokładana, gdy mapa była
jeszcze ciemna i czubek się w niej gubił. Na kolorowej mapie z obwódką robiła z pinezki
paciorek. Usunięta, nie wracać.

## Zdjęcie w Mapach Google pokazuje drugą stronę ulicy

Link prowadzi do **adresu**, a nie do firmy — Google nie ma tam żadnego obiektu, więc podstawia
najbliższą panoramę Street View, a te jeżdżą środkiem jezdni. **Z zewnątrz się tego nie zmieni.**

Jedyne wyjście: Michał zakłada **wizytówkę Google Business Profile**. Wtedy powstaje prawdziwy
obiekt z własnymi zdjęciami, godzinami i pinezką, a klub zaczyna wychodzić w „capoeira Koszalin".
To robota właściciela, wymaga weryfikacji. Na naszej stronie problem nie występuje — obrazek
obok mapki wybieramy sami.

Powiązane: [[status]], [[decision-nazewnictwo]]

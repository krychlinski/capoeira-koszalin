---
name: status
description: Na czym stoimy — stan wdrożenia strony capoeiry, aktualizowany na bieżąco
metadata:
  type: project
---

Stan na 2026-09-05.

## Zrobione

- Repo `krychlinski/capoeira-koszalin` (publiczne), gałąź `main`, dwa commity.
- Astro 7, 11 stron, ciemna kinowa szata (czerń `#0b0b0c`, bursztyn `#e08a2b`, Oswald + Barlow).
- `.pages.yml` — panel Pages CMS, pola zgodne ze schematem Zod, zweryfikowane parserem.
- Czysty build z klona przechodzi (`npm ci && npm run build`), `dist` waży 132 KB.
- Node 22 i `gh` doinstalowane na maszynie właściciela — wcześniej nie było ich wcale.
- **Strona żyje pod https://capoeira-koszalin.netlify.app** — hosting Netlify, build po każdym commicie.
- Treść z ODT-ów właściciela przeniesiona: prawdziwy grafik 7 grup, cennik (8 pozycji),
  FAQ (14 pytań), regulamin (20 paragrafów), oferta, telefon i Instagram.
- Menu: Zajęcia · Cennik · FAQ · Wydarzenia · Aktualności · Galeria · O nas + przycisk Kontakt.
  Instruktorzy scaleni ze stroną „O nas", regulamin w stopce.
- **Identyfikacja z oryginalnego pliku logo** (`MATERIAŁY/logo.png`, 2940×1182): pełny lockup
  w nagłówku i stopce, paleta wprost z pikseli znaku.
- **Historia grupy i kadra** na `/o-nas/` — z dokumentu klubu. Biogramy Piolho i Mafioso puste,
  mają je napisać sami; nie wymyślać za nich.

## Zrobione — wrzesień

- **Aktualności z Facebooka** działają: własna wtyczka, zdjęcia pobierane przed budowaniem,
  podstrona każdego wpisu z galerią. Wypunktowania rozpoznawane — [[project-formatowanie-fb]].
- **Polska typografia** na całej stronie: sierotki i cudzysłowy dolno-górne, warstwa pośrednia
  w `src/middleware.ts`, więc działa też na podglądzie.
- **Znaki przynależności** na „O nas": pieczęć UNICAR i logo TKKF przy odpowiednich akapitach —
  [[reference-znaki-svg]].
- **Strona „Pierwszy trening"** jako pierwsza zakładka w menu. Cała treść w panelu
  (`strony/pierwszy-trening.md` + wpis `strona-pierwszy-trening` w `.pages.yml`), w kodzie
  zostały tylko trzy przyciski nawigacyjne.
- FAQ startuje ze wszystkimi pytaniami zwiniętymi — plus przy każdym wierszu wystarcza za
  podpowiedź, że się rozwijają.
- Sekcje strony głównej **na przemian ciemne i jasne**, numerowane przez przeglądarkę
  (`section:not(.hero):nth-of-type()`), więc ukrycie wydarzeń albo galerii nie rozbija rytmu.
- Blok „Pierwszy trening nic nie kosztuje" przeniesiony **nad** grafik.
- Regulamin: naprawione **osiem zdań rozerwanych** pustym wierszem przy eksporcie z ODT,
  w tym rozcięte słowo „organizacyjno-finansowych".
- Daty w „O nas" poprawione przez właściciela: capoeira w Koszalinie od **2005**, obecna grupa
  od **2006**, współpraca z TKKF od **2008** (wcześniej było błędne 2004).
- **Favicon zostaje znak Akademii.** Pieczęć UNICAR była wypróbowana i odrzucona: ma napis po
  obwodzie i przy 16 px jest nieczytelną żółtą kropką. Nie wracać do tego.

## Do zrobienia

0. **PRZEPROWADZKA NA CLOUDFLARE — najpilniejsze.** Blokada 7 dni wieku konta już minęła.
   Po niej: ustawić sekret `CF_DEPLOY_HOOK` i dodać Michała do projektu w Cloudflare, żeby mógł
   sam kliknąć przebudowanie przy pilnej potrzebie (panelu CMS nie dostaje —
   [[decision-tryb-pracy]]). Harmonogram odświeżania: [[project-formatowanie-fb]].

1. **Podpiąć repo w Netlify** — tylko właściciel, wymaga autoryzacji aplikacji GitHubowej.
   Ustawień nie trzeba wpisywać, są w `netlify.toml`.
   Cloudflare Pages odpadło: nie pozwala założyć konta młodszego niż 7 dni (stan 2026-08-29).
   Gdyby ktoś do niego wracał — musi to być „Connect to Git", nigdy Direct Upload, bo projektu
   z bezpośredniego uploadu nie da się później połączyć z repo.
2. **Zdobyć brakujące dane od właściciela** — patrz sekcja niżej. Najpilniejszy jest adres sali:
   nie ma go w żadnym z materiałów, a bez niego nikt nie wie, gdzie przyjść na trening.
3. **Dodać kolegę jako collaboratora** — czeka na jego login GitHub. Bez tego nie wejdzie do panelu.
4. **Podmienić resztę treści oznaczonej `DO UZUPEŁNIENIA`** — biogram Michała, treść „O nas",
   szczegóły batizado. Grafik i dane kontaktowe są już prawdziwe.
5. **Przełączyć domenę** `capoeira.koszalin.pl` — to subdomena, więc wystarczy CNAME
   na adres Netlify plus dodanie domeny w panelu hostingu. Przed przełączeniem sprawdzić
   rekordy CAA na `koszalin.pl`, bo mogą zablokować wystawienie certyfikatu.

## Znane drobiazgi

- Build wypisuje ostrzeżenie o pustej kolekcji `galeria`. Zniknie po dodaniu pierwszego albumu.

Powiązane: [[decision-pages-cms]], [[decision-nie-wordpress]]


## Sale treningowe — stan przejściowy

Sezon 2026/2027 startuje **1 września w SP9**, ale tylko na dwa tygodnie. **Od 15 września**
zajęcia przenoszą się do własnej Akademii, którą klub właśnie remontuje (opóźnienie przez
konieczność położenia nowej posadzki — z posta na Facebooku z 27.08).

Dlatego pola `miejsce` i `adres` w kolekcji `zajecia` są **celowo puste**. Zamiast nich działa
komunikat z datą wygaśnięcia 2026-09-15 (`ustawienia.json` → `komunikat`). Adresy wpiszemy na
stałe, gdy będzie znany adres nowej Akademii.

Komunikat wygasza skrypt w przeglądarce, nie build — strona jest statyczna i sam build by daty
nie złapał. Mechanizm jest ogólny: służy też do odwołanych zajęć, ferii, zmiany sali.

## Brakujące dane (do zdobycia od właściciela)

Nie ma ich w materiałach źródłowych — nie wymyślaj ich:

- **Adres nowej Akademii** — do wpisania po 15 września, patrz sekcja wyżej.
- **Treść „O nas".** Plik `o nas.odt` zawiera wyłącznie tytuł, jest pusty.
- **Biogram i stopień (corda) Michała „Malandro" Sawińskiego.** Znana jest tylko rola:
  kierownik sekcji.
- **Adres e-mail.** Facebook już mamy: facebook.com/CapoeiraUnicarKoszalin
- Plik `Pierwsze zajęcia.odt` też jest pusty — sam tytuł.

Materiały źródłowe leżą w `MATERIAŁY/` i są w `.gitignore` — nie trafiają do publicznego repo.


## Paleta — dlaczego nie surowa zieleń z logo

Logo zawiera **dwie** zielenie, odczytane z pikseli `MATERIAŁY/logo.png`: `#005C2D` (85,2%
powierzchni znaku, odcień 149°) i `#72BE44` (14,8%, odcień 97°). Ciemna ma na tle #0b0b0c
kontrast **2,4:1** — poniżej progu czytelności, więc rolę akcentu przejmuje jasna (8,6:1).

Żadnego koloru nie wymyślamy. Wcześniejsza paleta oparta na `#33CC7A` była moim doborem sprzed
otrzymania pliku logo i została w całości usunięta.

| Zmienna | Wartość | Kontrast | Rola |
|---|---|---|---|
| `--akcent` | `#72BE44` | 8,6:1 | napisy, przyciski, aktywne linki — **dokładnie z logo** |
| `--akcent-jasny` | `#8CCA66` | 10,1:1 | podświetlenie przycisku, pochodna odcienia 97° |
| `--akcent-scisz` | `#538734` | 4,6:1 | ozdobne numery, „Axé!" — pochodna odcienia 98° |
| `--akcent-ciemny` | `#005C2D` | 2,4:1 | wyłącznie obramowania — **dokładnie z logo** |

**Nie używaj `--akcent-ciemny` do tekstu.** Dokładnie ten błąd wyszedł przy numerach 01/02/03 na
stronie zajęć — zgasły do niewidoczności. Od tego jest `--akcent-scisz`.

Kolor akcentu ma też postać `--akcent-rgb` do `rgba()` w gradientach, żeby zmiana odcienia była
w jednym miejscu, a nie w dziewięciu plikach.

Logo jest przemalowywane do koloru akcentu — w oryginalnej ciemnej zieleni byłoby na czarnym tle
prawie niewidoczne. Źródło: `MATERIAŁY/` nie zawiera logo, oryginał pochodzi z
`capoeira.koszalin.pl/wp-content/uploads/2021/04/Logo_Akademia_Capoeira_Koszalin_002.png` (770×804).


## Facebook — wtyczka Mety USUNIĘTA

Wtyczka Page Plugin była wpięta za zasłoną, ale **została wyrzucona na wyraźną prośbę
właściciela**. Nie przywracaj jej. Powody, wszystkie sprawdzone empirycznie:

- **Nie ma trybu ciemnego.** `colorscheme=dark` jest ignorowany, wnętrze jest cross-origin,
  więc nie da się go ostylować. Inwersja filtrem odpada — wywróciłaby zdjęcia w negatyw.
- **Renderuje najwyżej 5 postów**, nawet w kadrze 3000 px. Przewijanie odbija się od końca
  tej krótkiej listy i sprawia wrażenie zapętlenia. Nie da się tego naprawić konfiguracją.
- Meta wygasza social plugins (data 10.02.2026 w dokumentacji).

W zamian powstała **własna wtyczka** czytająca Graph API — patrz [[todo-facebook-api]].

**Skutek uboczny, który trzeba pilnować:** strona nie ładuje teraz absolutnie niczego z serwerów
Mety. Strona `/prywatnosc/` opisuje ten stan wprost. Gdyby ktoś kiedyś osadził wtyczkę FB, IG
albo YouTube, **trzeba równocześnie poprawić tamten tekst**, bo inaczej strona zacznie kłamać.

Strona `/prywatnosc/` opisuje stan faktyczny: brak własnych ciasteczek, wtyczka tylko po
kliknięciu, oraz **Google Fonts** — nie ustawiają ciasteczek, ale Google dostaje IP odwiedzającego.
Do rozważenia: hosting czcionek u siebie, wtedy strona nie odpytuje nikogo z zewnątrz.


## Klauzula RODO — WSTRZYMANA

W `MATERIAŁY/Klauzula rodo.odt` leży gotowa klauzula informacyjna. Michał (prowadzący akademię)
wyraźnie prosił: **nie publikować, dopóki nie zmieni się adres firmy.**

Dokument zawiera dane rejestrowe działalności, a **to repozytorium jest publiczne** — dlatego nie
przepisuję ich tutaj ani nigdzie poza `MATERIAŁY/`, które są w `.gitignore`. Gdy nadejdzie zgoda
na publikację, treść bierzemy prosto z pliku źródłowego.

Uwaga na pomyłkę: adres siedziby firmy z klauzuli to **co innego** niż sala treningowa.
Sala to ulica Szymanowskiego (z „O nas"), siedziba firmy to inny adres i właśnie ona się zmienia.


## Wycinanie sygnetu z lockupu — nie próbuj

`MATERIAŁY/logo.png` to pełny lockup. **Nie da się z niego wyciąć samego sygnetu prostokątnym
cięciem**: litery „CA" z napisu CAPOEIRA wchodzą w wycięcie pandeiro, więc znak i napis nachodzą
na siebie poziomo. Próba podziału po najszerszej przerwie między kolumnami daje sygnet
z wklejonym „CA" w środku — ten błąd już popełniono.

Czysty sygnet, bez liter, pochodzi z osobnego pliku ze starej strony:
`capoeira.koszalin.pl/wp-content/uploads/2021/04/Logo_Akademia_Capoeira_Koszalin_002.png`
(761×804 po przycięciu). Używany do favicona; w nagłówku i stopce idzie pełny lockup.

Oba pliki są przemalowywane skryptem: ciemna zieleń → `#72BE44`, jasna → `#A8A49B` w lockupie
(inaczej drobne „AKADEMIA/KOSZALIN" przebijają duże „CAPOEIRA", bo krem jest jaśniejszy od zieleni).


## Siatki: nie rysuj linii tłem kontenera

Wzorzec, który **dwukrotnie** wprowadził błąd: siatka z `gap: 1px` i tłem na kontenerze,
przez które prześwitują linie. Wygląda elegancko, ale działa tylko przy pełnej siatce —
gdy liczba elementów nie dzieli się przez liczbę kolumn, puste komórki ostatniego rzędu
pokazują szary prostokąt. Liczba kolumn zmienia się z szerokością ekranu, więc nie da się
tego zagwarantować doborem liczby elementów.

**Zawsze rysuj linie obramowaniami elementów:** kontener dostaje `border-top` i `border-left`,
każdy element `border-right` i `border-bottom`. Efekt identyczny, puste komórki nic nie pokazują.

Poprawione w: grafiku zajęć (`Grafik.astro`), galerii albumów (`galeria/[...slug].astro`),
galerii pod postem z Facebooka (`aktualnosci/fb/[id].astro`).

Wyjątek: `.pasek` na stronie głównej używa `gap: 1px`, ale to kontener elastyczny bez tła —
nie ma pustych komórek ani czego prześwitywać. Zostawić.


## build:czysty ubija warstwę treści działającego serwera

`npm run build:czysty` kasuje `.astro` i `node_modules/.astro`. Jeśli w tle działa
`npm run dev`, serwer traci warstwę treści i **od tej chwili pokazuje puste kolekcje** —
zero pytań w FAQ, pusty cennik, brak grup w grafiku. Strona jest w porządku, zepsuty jest
tylko podgląd.

**Po każdym `build:czysty` restartuj serwer deweloperski.** Zdarzyło się to trzy razy
i za każdym razem wyglądało jak regresja w kodzie, co kosztowało czas na diagnozę.

Sprawdzian, czy to ten przypadek: porównaj liczbę elementów w `dist/` z tym, co oddaje
`localhost`. Jeśli w `dist/` jest komplet, a na serwerze pustka — to on, nie kod.

**To samo w drugą stronę:** po dodaniu nowego pliku treści albo zmianie schematu w
`content.config.ts` serwer uparcie pokazuje stan sprzed zmiany. Sam restart NIE wystarcza —
trzeba skasować `.astro` i `node_modules/.astro`, dopiero potem wystartować od nowa.
Zdarzyło się przy dodawaniu strony „Pierwszy trening": build dawał komplet, `localhost` pustkę.

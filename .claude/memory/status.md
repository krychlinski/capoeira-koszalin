---
name: status
description: Na czym stoimy — stan wdrożenia strony capoeiry, aktualizowany na bieżąco
metadata:
  type: project
---

Stan na 2026-08-29 (po wgraniu materiałów źródłowych).

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
- **Identyfikacja przeniesiona ze starej strony:** zieleń zamiast bursztynu, oryginalne logo
  (pandeiro w kształcie „C") w nagłówku i faviconie.

## Do zrobienia

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

Zieleń logo to **#045C2D** (odczytana z pikseli pliku; wartość #275A32 widoczna w DOM starej
strony jest zafałszowana przezroczystością). Na tle #0b0b0c ma kontrast **2,4:1** — poniżej progu
czytelności. Stara strona używa jej na białym tle i tam działa.

Dlatego paleta ma trzy poziomy, wszystkie w odcieniu 148°:

| Zmienna | Wartość | Kontrast | Rola |
|---|---|---|---|
| `--akcent` | `#33CC7A` | 9,4:1 | napisy, przyciski, aktywne linki |
| `--akcent-scisz` | `#229155` | 4,9:1 | ozdobne numery, „Axé!" — widoczne, ale nie konkurują |
| `--akcent-ciemny` | `#045C2D` | 2,4:1 | wyłącznie obramowania i podkreślenia |

**Nie używaj `--akcent-ciemny` do tekstu.** Dokładnie ten błąd wyszedł przy numerach 01/02/03 na
stronie zajęć — zgasły do niewidoczności. Od tego jest `--akcent-scisz`.

Kolor akcentu ma też postać `--akcent-rgb` do `rgba()` w gradientach, żeby zmiana odcienia była
w jednym miejscu, a nie w dziewięciu plikach.

Logo jest przemalowywane do koloru akcentu — w oryginalnej ciemnej zieleni byłoby na czarnym tle
prawie niewidoczne. Źródło: `MATERIAŁY/` nie zawiera logo, oryginał pochodzi z
`capoeira.koszalin.pl/wp-content/uploads/2021/04/Logo_Akademia_Capoeira_Koszalin_002.png` (770×804).


## Facebook

Wtyczka Meta jest wpięta na `/aktualnosci/` **za zasłoną**: dopóki nikt nie kliknie, nie ładuje
się ani jeden skrypt czy iframe Meta, więc strona nie potrzebuje baneru zgody na ciasteczka.

Ograniczenia wtyczki, sprawdzone empirycznie — nie zgadywane:
- **Nie ma trybu ciemnego.** `colorscheme=dark` jest ignorowany. Wnętrze jest cross-origin,
  więc nie da się go ostylować. Obeszliśmy to ciemną ramką wokół; inwersja filtrem odpada,
  bo wywróciłaby zdjęcia w negatyw.
- Właściciel zgłaszał zapętlone przewijanie. Prawdopodobna przyczyna: `scrolling="no"`
  i za niski kadr — poprawione na 900 px z odblokowanym przewijaniem.
- Meta wygasza social plugins (data 10.02.2026 w dokumentacji, „graceful degradation to
  invisible elements"). Feed może kiedyś zniknąć — zasłona zostanie i nadal będzie sensowna.

Automatyczny import postów do Aktualności **odrzucony**: Graph API wymaga App Review Mety dla
`pages_read_engagement`, do tego cyklicznego builda, a zaciągałby surowy tekst z emoji.
Aktualności piszemy ręcznie, rzadko.

Strona `/prywatnosc/` opisuje stan faktyczny: brak własnych ciasteczek, wtyczka tylko po
kliknięciu, oraz **Google Fonts** — nie ustawiają ciasteczek, ale Google dostaje IP odwiedzającego.
Do rozważenia: hosting czcionek u siebie, wtedy strona nie odpytuje nikogo z zewnątrz.

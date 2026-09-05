# Przeprowadzka z Netlify na Cloudflare Pages

Powód: Netlify liczy **15 kredytów za deploy** przy 300 na miesiąc, czyli **20 deployów**,
z twardym limitem — po przekroczeniu strona zostaje wstrzymana. Cloudflare daje **3000 minut
budowania miesięcznie** i nielimitowany transfer. Nasz build trwa około dwóch minut, więc
odświeżanie co trzy godziny (244 buildy) zajmuje jakieś 500 minut z 3000.

Wszystkie pliki konfiguracyjne są już w repozytorium. Poniżej tylko to, co trzeba wyklikać.

## 1. Projekt — Pages, nie Worker

Cloudflare wycofało Pages w kwietniu 2025 i w panelu nie ma już jak takiego projektu założyć.
Worker ze statycznymi zasobami, którym zaczynaliśmy, **nie przyjmuje domeny z obcego DNS-u**,
a nasza strefa jest prowadzona w 42.pl. Dlatego projekt Pages powstał z linii poleceń:

```
npx wrangler login
npx wrangler pages project create capoeira-koszalin --production-branch main
```

Skutek uboczny, o którym trzeba pamiętać: **projektu założonego tak nie da się połączyć
z repozytorium.** Cloudflare buduje wyłącznie projekty połączone z gitem od samego początku.
Dlatego budujemy u GitHuba — patrz niżej.

## 2. Budowanie i wdrażanie

Wszystko robi `.github/workflows/wdroz.yml`: przy zmianie w `main`, co trzy godziny po nowe
posty z Facebooka i ręcznie przyciskiem **Run workflow**. Deploy hook nie jest potrzebny,
bo harmonogram i budowanie są w jednym miejscu.

W **Settings → Secrets and variables → Actions** repozytorium muszą być dwa sekrety:

| Sekret | Skąd |
|---|---|
| `FB_TOKEN` | token strony na Facebooku, ten sam co w lokalnym `.env` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token, uprawnienie **Cloudflare Pages: Edit** |

Identyfikator konta jest wpisany wprost w pliku — nie jest sekretem.

Osiem uruchomień na dobę to 244 miesięcznie. Minuty GitHub Actions w repozytorium publicznym
są darmowe, a limit budowania po stronie Cloudflare przy wdrażaniu gotowych plików nas nie
dotyczy — Cloudflare tu nic nie buduje, tylko przyjmuje wynik.

**Dlaczego `build:czysty`, a nie `npm run build`:** cache warstwy treści Astro potrafi
przetrwać między buildami i generować podstrony dla wpisów, które już usunięto. Skrypt
kasuje `.astro`, `node_modules/.astro` i `dist` przed budowaniem.

## 3. Zmienna z tokenem w Cloudflare

Niepotrzebna. Strona powstaje u GitHuba i tam siedzi `FB_TOKEN`. Cloudflare dostaje gotowe
pliki i nie odpytuje Facebooka.

## 4. Adresy kanoniczne — ZROBIONE

`site` w `astro.config.mjs` i adres mapy witryny w `public/robots.txt` wskazują
`https://www.capoeira.koszalin.pl`. Przy każdej zmianie adresu trzeba poprawić **oba** —
stąd biorą się adresy kanoniczne i cała mapa witryny.

## 5. Domena — UWAGA, nie da się tak, jak zakładaliśmy

Sprawdzone 2026-09-05. `capoeira.koszalin.pl` **nie jest zwykłą poddomeną, którą wystarczy
wskazać CNAME-em.** To osobna, delegowana strefa DNS: `koszalin.pl` należy do MAN Koszalin
i NASK, a nasza nazwa jest z niej delegowana na serwery `fns1.42.pl` i `fns2.42.pl`.
W tej strefie `capoeira.koszalin.pl` jest **wierzchołkiem**, a wierzchołkowi nie wolno nadać
rekordu CNAME — panel 42.pl mówi to wprost.

Dwie ściany, obie potwierdzone w dokumentacji Cloudflare:

- **Worker z własną domeną wymaga, żeby strefa była w Cloudflare.** Naszej nie da się tam
  wnieść: pojedyncza poddomena jako osobna strefa to funkcja z planu Enterprise, a całej
  `koszalin.pl` nie prowadzimy.
- **Cloudflare Pages przyjmuje domenę z obcego DNS-u, ale wyłącznie poddomenę**, nie
  wierzchołek strefy.

### Wyjście A — poprosić operatora `koszalin.pl` o zmianę delegacji

Zamiast delegacji na 42.pl operator wstawia u siebie zwykły rekord:

```
capoeira  IN  CNAME  capoeira-koszalin.pages.dev.
```

Wtedy nasza nazwa przestaje być wierzchołkiem osobnej strefy i staje się zwykłym rekordem
w `koszalin.pl`, a Pages przyjmie ją bez zastrzeżeń. Adres zostaje dokładnie taki, jaki
chcemy, i znika serwer z drogi.

Koszt: tracimy własny panel DNS dla tej nazwy — każda przyszła zmiana idzie przez operatora.
Wymaga też **przesiadki z Workera na projekt Pages**, bo Worker tej drogi nie obsługuje.

### Wyjście B — strona pod `www`, wierzchołek na przekierowaniu

Zostaje delegacja i panel 42.pl. W nim:

1. rekord CNAME `www` → `capoeira-koszalin.pages.dev.` (zamiast obecnego wskazania na
   `capoeira.koszalin.pl.`)
2. w Cloudflare Pages → **Custom domains** dodaj `www.capoeira.koszalin.pl`
3. wierzchołek zostaje przekierowaniem stałym na `https://www.capoeira.koszalin.pl` —
   albo z sekcji „Ramki i przekierowania WWW" w panelu 42.pl (najpierw sprawdź u nich,
   czy ich przekierowanie obsługuje HTTPS), albo z VPS-a OVH, który i tak działa.

Koszt: adresem kanonicznym zostaje `www.capoeira.koszalin.pl`.

### Certyfikat — CAA

`capoeira.koszalin.pl` nie ma własnych rekordów CAA, więc dziedziczy je po `koszalin.pl`.
Dozwolone są tam: `letsencrypt.org`, `sectigo.com`, `digicert.com`, `certum.pl`,
`comodoca.com`, `harica.gr`. **Nie ma `pki.goog`**, czyli domyślnego wystawcy Cloudflare.
Let's Encrypt jest na liście i Cloudflare z niego skorzysta, ale jeśli certyfikat nie
wystawi się w ciągu kilkunastu minut, to jest pierwsze miejsce do sprawdzenia — trzeba
wtedy poprosić operatora o dopisanie `0 issue "pki.goog"`.

Po przełączeniu, niezależnie od wyjścia, zmień adres w **dwóch** miejscach:
`astro.config.mjs` → `site` oraz `public/robots.txt` → wiersz `Sitemap:`. Stąd biorą się
adresy kanoniczne i mapa witryny. Rozważ też `"workers_dev": false` (albo wyłączenie
adresu `pages.dev`), żeby ta sama treść nie wisiała pod dwoma adresami.

## 6. Sprzątanie po przeprowadzce

Zostało do zrobienia:

1. **Netlify** — wyłączyć budowanie po commicie albo usunąć projekt. Inaczej przy każdym
   wypchnięciu zmian buduje tę samą stronę i zjada kredyty bez powodu. Potem można skasować
   `netlify.toml`.
2. **Worker `capoeira-koszalin`** — porzucony, nie przyjmie domeny. Kasuje się poleceniem
   `npx wrangler delete --name capoeira-koszalin`. Uwaga: nazywa się tak samo jak projekt
   Pages, więc łatwo pomylić je w panelu.
3. **WordPress na VPS-ie** — katalog `/var/www/html/capoeira/data/wordpress` nie jest już
   przez nic używany. Serwis Apache'a obsługuje wyłącznie przekierowanie gołego adresu.

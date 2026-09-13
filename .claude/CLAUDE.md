# Capoeira Koszalin — kontekst projektu

Strona Akademii Capoeira Koszalin (grupa Unicar Capoeira). Zastępuje starego, nieaktualizowanego
WordPressa pod `capoeira.koszalin.pl`.

## Stos

- **Astro 7**, statyczny build (`output: static`). Bez frameworka UI, bez Tailwinda — czysty CSS
  ze zmiennymi w `src/styles/global.css`.
- **Pages CMS** (app.pagescms.org) — panel dla nietechnicznego edytora, konfiguracja w `.pages.yml`.
  Zapis w panelu tworzy commit w repo, a commit uruchamia budowanie i wdrożenie.
- **Cloudflare Pages** — hosting statyczny, darmowy, projekt `capoeira-koszalin` (`wrangler.jsonc`).
  Zero serwera, zero bazy, zero łatania; to był główny powód odejścia od WordPressa.
  Nagłówki i przekierowania w `public/_headers` i `public/_redirects`.
- **Buduje GitHub Actions, nie Cloudflare** — `.github/workflows/wdroz.yml`: przy pushu do `main`,
  z harmonogramu (posty z Facebooka) i ręcznie. Projekt Pages założono z linii poleceń, więc
  nie da się go podpiąć pod repo. Sekrety (`FB_TOKEN`, `CLOUDFLARE_API_TOKEN`, `NOTIFY_SECRET`)
  siedzą w GitHubie, nie w panelu Cloudflare.
- **Limit Cloudflare Pages: 25 MiB na plik.** Większy plik w `dist` wywala wdrożenie — dotyczy
  zwłaszcza wideo.
- Netlify to przeszłość (do 2026-09-05): projekt wyłączony, `netlify.toml` usunięty.
  Historia przeprowadzki w `PRZEPROWADZKA.md`.

## Zasady, które łatwo złamać

- **Nazwy w kodzie po angielsku, wszystko, co widzi człowiek, po polsku.** Kolekcje, pola
  frontmattera, pliki, komponenty, klasy i zmienne CSS po angielsku (`news`, `classes`, `title`,
  `.eyebrow`, `--accent`). Po polsku zostają: komentarze, interfejs strony, adresy stron
  i nazwy plików w `src/pages/` (`/aktualnosci/`, `/o-nas/`), nazwy plików treści (wchodzą
  w adresy), etykiety `label:` w `.pages.yml`. Terminy capoeiry (`apelido`, `corda`) bez
  tłumaczenia. Szczegóły: `.claude/memory/decision_nazewnictwo.md`.
- **Schemat treści musi się zgadzać w dwóch miejscach naraz:** `src/content.config.ts` (Zod)
  i `.pages.yml` (Pages CMS). Zmiana pola w jednym bez drugiego wywala build albo psuje panel.
- **Zdjęcia leżą w `src/assets/media/`, nie w `public/`** — dzięki temu Astro je optymalizuje.
  CMS zapisuje ścieżkę jako `/media/plik.jpg`, a `src/lib/media.ts` mapuje ją po nazwie pliku.
  Nie przenoś mediów do `public/`, bo strona zacznie serwować oryginały z aparatu.
  Jedyny wyjątek: zdjęcia z postów na Facebooku pobiera przy budowaniu
  `integrations/facebook-images.mjs` do `public/media/fb/` (w `.gitignore`).
- **Filmy leżą w `src/assets/video/`** i są importowane w komponentach
  (`import promo from '../assets/video/promo-2014.mp4'`) — dostają hash w nazwie i długi cache.
  Kodujemy je ffmpegiem z oryginałów w `MATERIAŁY/Filmy promo/` (H.264, `-movflags +faststart`),
  każdy plik poniżej 25 MiB. Odtwarzacz z planszą i kadrami rozdziałów: `VideoPlayer.astro`,
  pętla w tle: `Hero.astro`. Poza panelem CMS — wymiana filmu to zmiana w kodzie.
- Puste katalogi kolekcji trzymają `.gitkeep`. Bez nich git je gubi i CMS nie ma gdzie pisać.
- Wersję Node ustala `.nvmrc` (czyta go workflow) i `engines` w `package.json` — Astro 7
  nie zbuduje się na starszym niż 22.

## Model treści

| Kolekcja | Katalog | Uwagi |
|---|---|---|
| `news` | `src/content/news` | pole `published` filtruje wpisy; posty z Facebooka dochodzą przy budowaniu |
| `events` | `src/content/events` | dzielone na nadchodzące/minione po `endDate ?? startDate` |
| `classes` | `src/content/classes` | jedna grupa = jeden plik, `sessions` to lista, sortowane po `order` |
| `instructors` | `src/content/instructors` | sortowane po `order` |
| `gallery` | `src/content/gallery` | `images` to płaska lista ścieżek, `cover` okładka |
| `pages` | `src/content/pages` | stałe pliki: `o-nas`, `kontakt`, `oferta`, `pierwszy-trening`, `gdzie-trenujemy`, `regulamin`; w panelu każdy to osobny wpis `strona-*` (regulaminu w panelu nie ma) |
| `pricing` | `src/content/pricing` | `category`: `monthly` albo `extra`, sortowane po `order` |
| `faq` | `src/content/faq` | `question` we frontmatterze, odpowiedź w treści, sortowane po `order` |
| ustawienia | `src/data/settings.json` | dane kontaktowe, hero, komunikat (`notice`), social |

## Stan

- Strona żyje pod **https://www.capoeira.koszalin.pl** (CNAME `www` → `capoeira-koszalin.pages.dev`).
  Goły `capoeira.koszalin.pl` to wierzchołek delegowanej strefy w 42.pl — CNAME-u mieć nie może,
  więc przekierowuje go 301 Apache na VPS-ie OVH. Wyłączenie VPS-a zabije adres bez `www`.
- Przy zmianie adresu poprawiaj **dwa** miejsca: `site` w `astro.config.mjs` i `Sitemap:`
  w `public/robots.txt`.
- Grafik, cennik, FAQ, regulamin, adres sali i telefon są prawdziwe. Wciąż brakuje m.in.
  biogramów instruktorów i adresu e-mail — lista w sekcji „Brakujące dane” w
  `.claude/memory/status.md`. Tych danych nie wymyślaj; puste pole zostaw puste.

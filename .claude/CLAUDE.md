# Capoeira Koszalin — kontekst projektu

Strona Akademii Capoeira Koszalin (grupa Unicar Capoeira). Zastępuje starego, nieaktualizowanego
WordPressa pod `capoeira.koszalin.pl`.

## Stos

- **Astro 7**, statyczny build (`output: static`). Bez frameworka UI, bez Tailwinda — czysty CSS
  ze zmiennymi w `src/styles/global.css`.
- **Pages CMS** (app.pagescms.org) — panel dla nietechnicznego edytora, konfiguracja w `.pages.yml`.
  Zapis w panelu tworzy commit w repo, hosting przebudowuje stronę.
- **Netlify** — hosting statyczny, darmowy, konfiguracja w `netlify.toml`. Zero serwera,
  zero bazy, zero łatania; to był główny powód odejścia od WordPressa.
  Cloudflare Pages odpadło: blokuje zakładanie kont młodszych niż 7 dni.

## Zasady, które łatwo złamać

- **Cały interfejs i nazwy pól są po polsku.** Kolekcje, pola frontmattera i klasy CSS też
  (`aktualnosci`, `zajecia`, `tytul`, `.nadtytul`). Nie mieszaj z angielskim.
- **Schemat treści musi się zgadzać w dwóch miejscach naraz:** `src/content.config.ts` (Zod)
  i `.pages.yml` (Pages CMS). Zmiana pola w jednym bez drugiego wywala build albo psuje panel.
- **Zdjęcia leżą w `src/assets/media/`, nie w `public/`** — dzięki temu Astro je optymalizuje.
  CMS zapisuje ścieżkę jako `/media/plik.jpg`, a `src/lib/media.ts` mapuje ją po nazwie pliku.
  Nie przenoś mediów do `public/`, bo strona zacznie serwować oryginały z aparatu.
- Puste katalogi kolekcji trzymają `.gitkeep`. Bez nich git je gubi i CMS nie ma gdzie pisać.
- Wersję Node ustala `.nvmrc` i `NODE_VERSION` w `netlify.toml` — Astro 7 nie zbuduje się
  na starszym niż 22.

## Model treści

| Kolekcja | Katalog | Uwagi |
|---|---|---|
| `aktualnosci` | `src/content/aktualnosci` | pole `opublikowany` filtruje wpisy |
| `wydarzenia` | `src/content/wydarzenia` | dzielone na nadchodzące/minione po `dataDo ?? dataOd` |
| `zajecia` | `src/content/zajecia` | jedna grupa = jeden plik, `terminy` to lista |
| `instruktorzy` | `src/content/instruktorzy` | sortowane po `kolejnosc` |
| `galeria` | `src/content/galeria` | `zdjecia` to płaska lista ścieżek |
| `strony` | `src/content/strony` | tylko `o-nas` i `kontakt`, stałe pliki |
| ustawienia | `src/data/ustawienia.json` | dane kontaktowe, hero, social |

## Stan

- Domena `capoeira.koszalin.pl` jest w całości pod kontrolą właściciela — przełączenie DNS na końcu.
  Do tego czasu `site` w `astro.config.mjs` wskazuje na adres `.netlify.app`.
- Treść startowa zawiera znaczniki `DO UZUPEŁNIENIA` (godziny zajęć, sale, adresy, biogram).
  To placeholdery, nie fakty — nie traktuj ich jak prawdziwych danych.

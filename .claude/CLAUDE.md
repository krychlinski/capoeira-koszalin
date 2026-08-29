# Capoeira Koszalin — kontekst projektu

Strona Akademii Capoeira Koszalin (grupa Unicar Capoeira). Zastępuje starego, nieaktualizowanego
WordPressa pod `capoeira.koszalin.pl`.

## Stos

- **Astro 7**, statyczny build (`output: static`). Bez frameworka UI, bez Tailwinda — czysty CSS
  z zmiennymi w `src/styles/global.css`.
- **Sveltia CMS** w `public/admin/` — panel dla nietechnicznego edytora. Zapisuje commity do repo,
  hosting przebudowuje stronę automatycznie.
- Hosting statyczny (Cloudflare Pages / Netlify), darmowy. Zero serwera, zero bazy, zero łatania —
  to był główny powód odejścia od WordPressa.

## Zasady, które łatwo złamać

- **Cały interfejs i nazwy pól są po polsku.** Kolekcje, pola frontmattera i klasy CSS też
  (`aktualnosci`, `zajecia`, `tytul`, `.nadtytul`). Nie mieszaj z angielskim.
- **Schemat treści musi się zgadzać w dwóch miejscach naraz:** `src/content.config.ts` (Zod)
  i `public/admin/config.yml` (Sveltia). Zmiana pola w jednym bez drugiego wywala build.
- **Zdjęcia leżą w `src/assets/media/`, nie w `public/`** — dzięki temu Astro je optymalizuje.
  CMS zapisuje ścieżkę jako `/media/plik.jpg`, a `src/lib/media.ts` mapuje ją po nazwie pliku.
  Nie przenoś mediów do `public/`, bo strona zacznie serwować oryginały z aparatu.
- Puste katalogi kolekcji trzymają `.gitkeep`. Bez nich git je gubi i CMS nie ma gdzie pisać.

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
- Treść startowa zawiera znaczniki `DO UZUPEŁNIENIA` (godziny zajęć, sale, adresy, biogram).
  To placeholdery, nie fakty — nie traktuj ich jak prawdziwych danych.

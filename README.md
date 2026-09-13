# Capoeira Koszalin

Strona Akademii Capoeira Koszalin. Astro + Pages CMS, hosting na Cloudflare Pages.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Strona: <http://localhost:4321>

## Komendy

| Komenda | Co robi |
|---|---|
| `npm run dev` | serwer deweloperski z podglądem na żywo |
| `npm run build` | build produkcyjny do `dist/` |
| `npm run preview` | podgląd zbudowanej strony |

## Gdzie co leży

```
src/content/       treść edytowana przez CMS (markdown)
src/data/          settings.json — dane kontaktowe, hero, social
src/assets/media/  zdjęcia (optymalizowane przy budowaniu)
.pages.yml         konfiguracja panelu Pages CMS
```

## Edycja treści

Panel: <https://app.pagescms.org/krychlinski/capoeira-koszalin/main>

Logowanie kontem GitHub — redaktor musi być collaboratorem w tym repozytorium. Zapis w panelu
tworzy commit, a GitHub Actions (`.github/workflows/wdroz.yml`) buduje stronę i wdraża ją
na Cloudflare Pages. Zmiana jest widoczna po kilku minutach — postęp widać w zakładce **Actions**.

Pola panelu opisuje `.pages.yml`. Muszą się zgadzać ze schematem w `src/content.config.ts`.

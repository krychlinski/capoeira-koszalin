# Capoeira Koszalin

Strona Akademii Capoeira Koszalin. Astro + Sveltia CMS, hosting statyczny.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Strona: <http://localhost:4321> · Panel: <http://localhost:4321/admin/>

## Komendy

| Komenda | Co robi |
|---|---|
| `npm run dev` | serwer deweloperski z podglądem na żywo |
| `npm run build` | build produkcyjny do `dist/` |
| `npm run preview` | podgląd zbudowanej strony |

## Gdzie co leży

```
src/content/       treść edytowana przez CMS (markdown)
src/data/          ustawienia.json — dane kontaktowe, hero, social
src/assets/media/  zdjęcia (optymalizowane przy budowaniu)
public/admin/      panel Sveltia CMS
```

## Edycja treści

Panel pod adresem `/admin/`. Logowanie kontem GitHub — wymaga wcześniejszej konfiguracji
klienta OAuth (patrz `.claude/memory/todo_oauth_cms.md`).

Zapis w panelu tworzy commit w repozytorium, a hosting przebudowuje stronę automatycznie.
Zmiana jest widoczna po około minucie.

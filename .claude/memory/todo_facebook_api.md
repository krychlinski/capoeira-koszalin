---
name: todo-facebook-api
description: Automatyczne pobieranie postów z Facebooka — DZIAŁA na produkcji od 2026-09-02
metadata:
  type: project
---

**URUCHOMIONE 2026-09-02.** Na produkcji zaciąga się 10 postów z ostatnich 31 dni.

## Pułapka, która kosztowała jeden deploy

Do Netlify trafił najpierw **token użytkownika zamiast tokenu strony**. Meta odrzuca go
komunikatem `code 190, subcode 2069032` („token dostępu użytkownika nie jest obsługiwany").
Łatwo o to, bo po `Generate Access Token` w polu Access Token widnieje właśnie token
użytkownika i kusi, żeby go skopiować.

**Token strony bierze się z listy `User or Page` w Explorerze** — wybierasz tam
„Akademia Capoeira Koszalin", a pole tokenu przeładowuje się na właściwy. Alternatywnie
z odpowiedzi `me/accounts`, z bloku o tej nazwie.

Przy odtwarzaniu tokenu w przyszłości: to jest ten krok, na którym się potknięto.

## Potwierdzone przy okazji

- Zmienne oznaczone w Netlify jako **sekret docierają do builda** — `import.meta.env.FB_TOKEN`
  je odczytuje.
- **Odporność na awarię zadziałała w boju:** przy złym tokenie build zakończył się sukcesem,
  15 stron, strona żyła. Zniknęła tylko sekcja z postami, a powód wylądował w logu.

## Co jest zrobione

- `src/lib/facebook.ts` — pobiera posty z Graph API przy budowaniu. Domyślnie `v26.0`
  (tyle pokazuje Graph API Explorer), okno 31 dni, limit 25 postów.
- `src/lib/news.ts` — łączy ręczne wpisy z kolekcji `news` z postami z Facebooka w jeden
  strumień; na liście renderuje je `PostCard.astro`, każdy post ma podstronę
  `src/pages/aktualnosci/fb/[id].astro`. Skróty na liście przez `truncate()` (domyślnie 320 znaków).
  Zastępuje usuniętą wtyczkę Mety — to jedyny mechanizm pokazywania postów na stronie.
- `integrations/facebook-images.mjs` — pobiera zdjęcia z postów przy budowaniu do
  `public/media/fb/` (w `.gitignore`). Wyjątek od zasady „media w `src/assets`”.
- `FACEBOOK.md` — instrukcja konfiguracji krok po kroku.
- `.env` dopisane do `.gitignore`.

**Degradacja sprawdzona empirycznie:** brak tokenu i nieprawidłowy token → build kończy się
sukcesem (15 stron), sekcja się nie renderuje, w logu ląduje linia `[facebook]` z komunikatem
Mety. Awaria Facebooka nigdy nie wywala builda.

## Aplikacja na Meta — utworzona

- Nazwa: `capoeira-koszalin`, App ID `1008958668838774`
- Status **Unpublished** (tryb deweloperski) — tak ma zostać
- Use case: **Manage everything on your Page**
- Uprawnienia włączone w use case i potwierdzone w debuggerze:
  `pages_read_engagement`, `pages_read_user_content`, `pages_show_list`
- App Review **nie jest wymagane** — Meta pokazała „No requirements identified"
- Token użytkownika Kacpra działa i jest długożyciowy (60 dni). Meta wydaje takie od razu,
  więc **krok „Extend Access Token" w debuggerze nie istnieje** — nie szukaj go.

## BLOKADA — ZDJĘTA 2026-09-02

Przez pewien czas `me/accounts` zwracało pustą tablicę, bo konto Kacpra nie miało roli na
fanpage'u — Meta wymaga formalnej roli przypisanej w ustawieniach strony, samo bycie
instruktorem nie wystarcza. Michał nadał uprawnienia i token strony został wygenerowany.

`FB_TOKEN` jest od 2026-09-05 **sekretem repozytorium na GitHubie** (Settings → Secrets and
variables → Actions), bo stronę buduje GitHub Actions — patrz [[reference-hosting]]. Sekretu
nie da się odczytać. Gdyby token przestał działać, trzeba go wygenerować od nowa w Graph API
Explorerze, a nie szukać starego.

## Podmiana tokenu

Wklejany **wyłącznie** jako sekret `FB_TOKEN` na GitHubie, potem Actions → „Zbuduj i wdróż”
→ Run workflow.
**Nigdy nie przyjmuj tokenu w czacie i nie zapisuj go w repo — repozytorium jest publiczne.**

## Świadome ograniczenia v1

- ~~Tylko tekst, bez zdjęć~~ — zdjęcia są już pobierane przy budowaniu (adresy z FB są
  podpisane i wygasają, dlatego nie linkujemy ich wprost).
- Posty odświeżają się **przy budowaniu**, nie na żywo. Cykliczne budowanie robi harmonogram
  w `.github/workflows/wdroz.yml`.

Powiązane: [[decision-pages-cms]], [[status]]

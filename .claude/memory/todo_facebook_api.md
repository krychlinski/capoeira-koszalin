---
name: todo-facebook-api
description: Automatyczne pobieranie postów z FB — kod gotowy, zablokowane brakiem roli na stronie
metadata:
  type: project
---

Stan na 2026-09-01. **Kod jest napisany i przetestowany. Brakuje wyłącznie tokenu.**

## Co jest zrobione

- `src/lib/facebook.ts` — pobiera posty z Graph API przy budowaniu. Domyślnie `v26.0`
  (tyle pokazuje Graph API Explorer), okno 31 dni, limit 25 postów.
- `src/components/PostyFb.astro` — renderuje je w kolorach strony, wpięte na `/aktualnosci/`.
  Dłuższe wpisy ucinane po ~320 znakach z odnośnikiem na Facebooka.
  Zastępuje usuniętą wtyczkę Mety — to jedyny mechanizm pokazywania postów na stronie.
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

## BLOKADA

`me/accounts` zwraca pustą tablicę. Okno zgody mówi wprost: **„Nie masz żadnych zasobów typu
Strony"**. Konto Kacpra (`Kacper Mafiozo Rychliński`) **nie ma żadnej roli na fanpage'u
Akademii**. To nie usterka — Meta wymaga formalnej roli przypisanej w ustawieniach strony.

**Odblokowanie:** Michał (prowadzący) dodaje Kacpra na stronie w
`Ustawienia → Dostęp do strony → Osoby z dostępem do Facebooka`. Wystarczy częściowa kontrola
z uprawnieniem do treści. Potem Kacper powtarza `Generate Access Token` w Explorerze i Akademia
pojawi się na liście.

Plan B: Michał zostaje dodany w `App roles` jako Tester/Developer i generuje token u siebie.
Gorszy — token wisi wtedy na jego koncie i umrze, gdy straci rolę.

## Gdy token już będzie

Wklejany **wyłącznie** do Netlify jako zmienna `FB_TOKEN`
(`Project configuration → Environment variables`), potem `Trigger deploy`.
**Nigdy nie przyjmuj tokenu w czacie i nie zapisuj go w repo — repozytorium jest publiczne.**

## Świadome ograniczenia v1

- **Tylko tekst, bez zdjęć.** Adresy obrazków z FB są podpisane i wygasają, więc wymagają
  pobierania przy budowaniu. Do zrobienia w drugim kroku.
- Posty odświeżają się **przy budowaniu**, nie na żywo. Dla automatu trzeba dołożyć cykliczny
  build w Netlify (Build hooks + cron albo Scheduled Functions).

Powiązane: [[decision-pages-cms]], [[status]]

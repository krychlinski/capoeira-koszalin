# Capoeira Koszalin — pamięć projektu

## Gdzie jesteśmy
- [Status wdrożenia](status.md) — co zrobione, co następne, znane drobiazgi

## Działające mechanizmy
- [Automat z Facebooka](todo_facebook_api.md) — zaciąga posty z ostatnich 31 dni, działa od 2026-09-02

## Decyzje
- [Dlaczego nie WordPress](decision_nie_wordpress.md) — powód migracji i odrzucone alternatywy
- [Panel to Pages CMS](decision_pages_cms.md) — brak adresu na localhost, zapis = commit, brak bazy danych
- [Limit buildów Netlify](decision_netlify_limit.md) — 20 buildów/miesiąc; przenieść hosting zanim Michał dostanie panel

## Wzorce w kodzie
- [Hosting po przeprowadzce](reference_hosting.md) — Pages + GitHub Actions, dlaczego `www`, pułapki z certyfikatami
- [Znaki i SVG](reference_znaki_svg.md) — przycinanie viewBox, klasa `.znak` przy akapicie
- [Formatowanie treści z FB](project_formatowanie_fb.md) — kiedy pobiera posty, wypunktowania, polskie cudzysłowy

## Jak pracujemy
- [Tryb pracy nad treścią](decision_tryb_pracy.md) — Michał podsyła zmiany, wprowadza je Kacper przez Claude'a; panel to zapas
- [Podawaj adres localhost](feedback_podawaj_url.md) — serwer stoi na stałym porcie 4321, adres w każdej odpowiedzi ze zmianą w wyglądzie

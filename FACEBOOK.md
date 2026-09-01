# Automatyczne pobieranie postów z Facebooka

Strona potrafi zaciągać wpisy z profilu klubu i wyświetlać je **w swoich kolorach**, bez
wtyczki Meta, bez ciasteczek i bez białego prostokąta. Domyślnie jest to wyłączone —
włącza się przez podanie tokenu.

Bez tokenu strona buduje się normalnie, a sekcja z postami po prostu się nie pokazuje.
To samo dzieje się, gdy token wygaśnie albo Facebook przestanie odpowiadać: **build nigdy
nie pada z tego powodu**.

## Co trzeba zrobić raz

Wszystkie kroki wykonuje administrator strony na Facebooku. **Tokenu nie przekazuj nikomu
w czacie ani mailem** — wklejasz go wyłącznie w panelu Netlify.

1. Wejdź na <https://developers.facebook.com/apps> i utwórz aplikację typu **Business**.
   Aplikacja zostaje w trybie deweloperskim — App Review nie jest potrzebne, bo czytasz
   własną stronę, której jesteś administratorem.
2. W **Graph API Explorer** wybierz swoją aplikację i stronę, po czym zaznacz uprawnienia
   `pages_read_engagement` oraz `pages_read_user_content`.
3. Wygeneruj **User Access Token**, zamień go na **długożyciowy**, a z niego wygeneruj
   **Page Access Token**. Ten ostatni nie wygasa.
4. W Netlify: **Project configuration → Environment variables → Add a variable**

   | Zmienna | Wartość |
   |---|---|
   | `FB_TOKEN` | wygenerowany Page Access Token |

5. Uruchom ponowny deploy (**Deploys → Trigger deploy**).

## Zmienne opcjonalne

| Zmienna | Domyślnie | Do czego |
|---|---|---|
| `FB_DNI` | `31` | ile dni wstecz pobierać |
| `FB_STRONA` | `CapoeiraUnicarKoszalin` | nazwa profilu w adresie |
| `FB_API_VERSION` | `v26.0` | wersja Graph API — podbij, gdy Meta wycofa obecną |

## Świeżość

Strona jest statyczna, więc posty odświeżają się **przy każdym budowaniu**: po zapisie
w panelu CMS albo po zmianie w repozytorium. Żeby zaciągały się same, ustaw w Netlify
cykliczny build (**Build & deploy → Build hooks** plus zewnętrzny cron, albo Scheduled
Functions).

## Lokalnie

Utwórz plik `.env` w katalogu projektu — jest w `.gitignore`, więc nie trafi do repozytorium:

```
FB_TOKEN=twoj-token
```

## Gdy przestanie działać

Zajrzyj do logu builda w Netlify i poszukaj linii `[facebook]`. Zawiera dokładny komunikat
od Mety — najczęściej wygasły albo unieważniony token (kod 190) i wtedy trzeba wygenerować
nowy.

# Przeprowadzka z Netlify na Cloudflare Pages

Powód: Netlify liczy **15 kredytów za deploy** przy 300 na miesiąc, czyli **20 deployów**,
z twardym limitem — po przekroczeniu strona zostaje wstrzymana. Cloudflare daje **3000 minut
budowania miesięcznie** i nielimitowany transfer. Nasz build trwa około dwóch minut, więc
odświeżanie co trzy godziny (244 buildy) zajmuje jakieś 500 minut z 3000.

Wszystkie pliki konfiguracyjne są już w repozytorium. Poniżej tylko to, co trzeba wyklikać.

## 1. Utworzenie projektu

Konto Cloudflare musi mieć co najmniej 7 dni — świeże odbija się komunikatem
„Your user account must be at least 7 days old". Dotyczy to zakładania **nowego konta**
(Account), a nie projektu w koncie już istniejącym.

**Idziemy przez Workers, nie przez Pages.** Cloudflare wycofało Pages w kwietniu 2025;
istniejące projekty działają dalej, ale nowe zakłada się jako Worker ze statycznymi zasobami.
Wszystko, czego potrzebujemy, tam jest: `_headers`, `_redirects` i deploy hooki (te ostatnie
od kwietnia 2026).

1. `dash.cloudflare.com` → **Workers & Pages** → **Create** → **Import a repository**
2. Wybierz repozytorium `capoeira-koszalin`

| Pole | Wartość |
|---|---|
| Project name | `capoeira-koszalin` |
| Build command | `npm run build:czysty` |
| Deploy command | `npx wrangler deploy` |

Odznacz **Builds for non-production branches** — pracujemy tylko na `main`, a zaznaczone
budowałoby każdą inną gałąź.

Reszty nie wpisuje się w formularzu, bo jest w `wrangler.jsonc` w repozytorium: nazwa,
katalog z plikami (`dist`), adresy z ukośnikiem na końcu i własna strona 404. Wersję Node
ustala `.nvmrc`.

**Bez `wrangler.jsonc` w repozytorium build się wywali** — `wrangler deploy` nie ma wtedy
skąd wziąć konfiguracji. Plik musi być wypchnięty na GitHuba przed pierwszym budowaniem.

**Dlaczego `build:czysty`, a nie `npm run build`:** cache warstwy treści Astro potrafi
przetrwać między buildami i generować podstrony dla wpisów, które już usunięto. Skrypt
kasuje `.astro`, `node_modules/.astro` i `dist` przed budowaniem.

## 2. Zmienna z tokenem

**Settings → Environment variables → Production**:

| Zmienna | Wartość |
|---|---|
| `FB_TOKEN` | token ze strony na Facebooku |

Zaznacz **Encrypt**. Kod przyjmuje zarówno token użytkownika, jak i strony — sam
rozstrzyga, którym się posłużyć.

Opcjonalnie: `FB_DNI` (domyślnie 31), `FB_API_VERSION` (domyślnie v26.0).

## 3. Odświeżanie co trzy godziny

1. Cloudflare → projekt → **Settings → Builds → Deploy Hooks**
   - nazwa: `harmonogram`, gałąź: `main`
   - skopiuj wygenerowany adres
2. GitHub → repozytorium → **Settings → Secrets and variables → Actions → New repository secret**
   - nazwa: `CF_DEPLOY_HOOK`, wartość: adres z punktu 1

Harmonogram jest w `.github/workflows/odswiez.yml` i działa od razu po dodaniu sekretu.
Bez sekretu kończy się bez błędu i nic nie robi. Można go też uruchomić ręcznie
przyciskiem **Run workflow**.

**Adres hooka jest jak hasło** — kto go ma, może uruchamiać buildy. Trzymaj go wyłącznie
w sekretach GitHuba.

## 4. Po pierwszym udanym buildzie

Podmień adres w dwóch miejscach i wypchnij:

- `site` w `astro.config.mjs`
- adres sitemapy w `public/robots.txt`

## 5. Domena

`capoeira.koszalin.pl` to subdomena, więc nie trzeba przenosić całej strefy DNS:

1. u dostawcy DNS dodaj **CNAME** wskazujący na `<projekt>.pages.dev`
2. w Cloudflare Pages → **Custom domains** potwierdź domenę

**Oba kroki są obowiązkowe** — sam CNAME bez potwierdzenia w panelu daje błąd 522.
Certyfikat SSL wystawia się automatycznie, o ile rekordy CAA na `koszalin.pl` nie blokują
Cloudflare — warto to sprawdzić przed przełączeniem.

## 6. Wygaszenie Netlify

Dopiero gdy Cloudflare działa i domena wskazuje na niego. Pliki `_redirects` i `_headers`
czyta i jeden, i drugi hosting, więc przez czas przejściowy obie wersje zachowują się tak samo.
`netlify.toml` można wtedy usunąć.

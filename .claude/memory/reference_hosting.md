---
name: reference-hosting
description: Jak strona jest postawiona po przeprowadzce — Pages, GitHub Actions, ograniczenia DNS
metadata:
  type: reference
---

Stan od 2026-09-05. Strona żyje pod **https://www.capoeira.koszalin.pl**.

## Droga żądania

`capoeira.koszalin.pl` → 301 z Apache'a na VPS-ie OVH → `www.capoeira.koszalin.pl`
→ CNAME → `capoeira-koszalin.pages.dev` → Cloudflare Pages.

## Dlaczego tak, a nie prościej

`capoeira.koszalin.pl` jest **osobną, delegowaną strefą DNS** (`koszalin.pl` należy do MAN
Koszalin i NASK, nasza nazwa jest delegowana na `fns1.42.pl`). Nasza nazwa jest w tej strefie
wierzchołkiem, a wierzchołkowi nie wolno nadać CNAME-u. Stąd trzy konsekwencje:

- **Worker odpadł.** Własna domena w Workerze wymaga strefy prowadzonej w Cloudflare.
  Wnieść jej tam nie można — poddomena jako osobna strefa to Enterprise.
- **Strona stoi na `www`**, bo tylko poddomenę da się wskazać CNAME-em. Pages przyjmuje
  poddomenę z obcego DNS-u, wierzchołka nie.
- **Wierzchołek musi mieć rekord A**, więc odbija go serwer. WordPress skasowany, w Apache'u
  został sam `RewriteRule` z wyjątkiem na `/.well-known/acme-challenge/` — bez tego wyjątku
  przekierowanie połknęłoby zapytania Let's Encrypta i po trzech miesiącach padłby certyfikat.

Certyfikat na VPS-ie (`capoeira.koszalin.pl-0002`) został **zawężony do samego wierzchołka**.
Wcześniej obejmował też `www`, które wskazuje już na Cloudflare — odnowienie by się wywaliło.

Certyfikat dla `www` wystawia Cloudflare. Zaczął od Google Trust Services, którego rekordy CAA
odziedziczone po `koszalin.pl` nie dopuszczają, i sam przełączył się na Let's Encrypt. Gdyby
kiedyś certyfikat nie chciał się wystawić, to jest pierwsze miejsce do sprawdzenia.

## Budowanie

Projekt Pages powstał z linii poleceń (`wrangler pages project create`), bo w panelu nie ma już
takiej opcji. **Takiego projektu Cloudflare nie pozwala połączyć z repozytorium** — buduje
tylko te podpięte do gita od początku. Dlatego buduje GitHub Actions
(`.github/workflows/wdroz.yml`): przy zmianie w `main`, co trzy godziny i ręcznie przyciskiem.
Cloudflare nic nie buduje, przyjmuje gotowe pliki.

Sekrety w repozytorium: `FB_TOKEN` i `CLOUDFLARE_API_TOKEN` (uprawnienie Cloudflare Pages: Edit,
token `github-pages-capoeira`). Identyfikator konta jest wpisany wprost w workflow.

**Przy zmianie adresu strony poprawiaj DWA miejsca:** `site` w `astro.config.mjs` i wiersz
`Sitemap:` w `public/robots.txt`.

## Kiedy zniknie VPS w OVH

Przekierowanie gołego adresu stoi na tym serwerze. **Jego wyłączenie zabije `capoeira.koszalin.pl`**
— zostanie tylko `www`, a kto wpisze adres bez `www`, trafi w pustkę. Kacper planuje kiedyś ten
serwer usunąć.

Wtedy jedyne wyjście to poprosić administratorów `koszalin.pl` (MAN Koszalin / NASK) o zdjęcie
delegacji na 42.pl i wstawienie u siebie zwykłego rekordu:

```
capoeira  IN  CNAME  capoeira-koszalin.pages.dev.
```

Nasza nazwa przestaje wtedy być wierzchołkiem osobnej strefy, więc CNAME jest dozwolony i strona
może wrócić na goły adres. Kosztem jest utrata panelu DNS w 42.pl — każda przyszła zmiana idzie
przez nich. Wymaga też przestawienia `site` i `robots.txt` z powrotem na adres bez `www`.

Powiązane: [[status]], [[project-formatowanie-fb]]

---
name: todo-oauth-cms
description: Sveltia CMS wymaga własnego klienta OAuth — panel nie działa bez tego kroku
metadata:
  type: project
---

Sveltia CMS **nie ma wbudowanego endpointu OAuth**. Żeby logowanie GitHubem w `/admin` zadziałało,
trzeba osobno:

1. zarejestrować OAuth App na GitHubie (Settings → Developer settings → OAuth Apps),
2. wdrożyć „Sveltia CMS Authenticator" jako Cloudflare Worker z client ID i secretem,
3. wpisać URL workera jako `base_url` w `public/admin/config.yml`.

**Dlaczego to ważne:** dopóki to nie jest zrobione, panel się otworzy, ale nie zaloguje — i wygląda
to jak zepsuta strona, a nie brakujący krok konfiguracji.

**Jak stosować:** client secret wpisuje właściciel samodzielnie w panelu Cloudflare albo przez
`wrangler secret put` — nie przekazuj go w czacie ani nie zapisuj w repo.

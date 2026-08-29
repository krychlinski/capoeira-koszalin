---
name: decision-pages-cms
description: Panel treści to Pages CMS, nie Sveltia — i dlaczego Sveltia odpadła
metadata:
  type: project
---

Treść edytuje się w **Pages CMS** (app.pagescms.org), konfiguracja w `.pages.yml` w korzeniu repo.

Sveltia CMS była zbudowana i działała, ale została usunięta. Powód: Sveltia nie ma własnego
serwera OAuth, więc wymagała zarejestrowania OAuth App na GitHubie i wdrożenia workera
z client secretem. Pages CMS nie wymaga żadnej infrastruktury — redaktor loguje się GitHubem
na ich stronie.

Cena tej wygody: panel mieszka pod adresem Pages CMS, a nie pod `capoeira.koszalin.pl/admin`.

**Dlaczego to ważne:** nie proponuj przywracania Sveltii ani stawiania własnego panelu pod
domeną, dopóki nikt o to nie poprosi — świadomie wybrano brak infrastruktury.

**Jak stosować:** zmiana pola w `.pages.yml` musi iść w parze ze zmianą w `src/content.config.ts`.
Powiązane: [[decision-nie-wordpress]]

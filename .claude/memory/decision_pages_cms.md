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

**Panel nie ma adresu na localhost i nigdy nie będzie go miał.** Nie stawia się go razem
z `npm run dev` — to cudza usługa działająca na repozytorium przez API GitHuba, nie część tego
projektu. Adres: https://app.pagescms.org, logowanie kontem GitHub, po zalogowaniu wybiera się
repozytorium `krychlinski/capoeira-koszalin`.

**Zapis w panelu to commit.** Panel zmienia plik `.md` i wypycha go do gałęzi w imieniu
zalogowanej osoby — w historii wygląda jak zwykły commit z jej nazwiskiem. Netlify obserwuje
gałąź, więc commit uruchamia budowanie i po kilku minutach zmiana jest na stronie. Żadnej bazy
danych nie ma: cała treść to pliki w repozytorium, a `.pages.yml` opisuje tylko, jakie pola
pokazać. Konsekwencja kredytowa: [[decision-netlify-limit]].

**Jak stosować:** zmiana pola w `.pages.yml` musi iść w parze ze zmianą w `src/content.config.ts`.
Po dodaniu pliku treści albo zmianie schematu serwer deweloperski pokazuje stan sprzed zmiany,
dopóki nie skasuje się `.astro` i `node_modules/.astro` i nie wystartuje go od nowa —
sam restart nie wystarcza. Patrz [[status]].

Powiązane: [[decision-nie-wordpress]]

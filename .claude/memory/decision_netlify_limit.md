---
name: decision-netlify-limit
description: Zapis w panelu = commit = build = 15 kredytów; przenieść hosting ZANIM Michał dostanie dostęp
metadata:
  type: project
---

Netlify liczy **15 kredytów za każdy build produkcyjny**, przy 300 kredytach na miesiąc.
To **20 buildów** i limit twardy: po jego wyczerpaniu Netlify wstrzymuje stronę do końca cyklu.
Cykl kończy się 28 dnia miesiąca.

**Dlaczego to ważne teraz:** zapis w panelu Pages CMS robi commit, commit uruchamia build.
Michał poprawiający literówkę i zapisujący trzy razy zużywa 45 kredytów. Jeden wieczór pracy
nad treścią potrafi wyczerpać miesięczny limit i zgasić stronę.

**Jak stosować:** nie dawaj dostępu do panelu, dopóki hosting siedzi na Netlify. Najpierw
przeprowadzka na Cloudflare Pages (500 buildów/miesiąc) według `PRZEPROWADZKA.md`. Z tego
samego powodu odświeżanie postów z Facebooka dwa razy dziennie jest na Netlify niemożliwe —
60 buildów miesięcznie to trzykrotność całego limitu.

Stan na 2026-09-05: przeprowadzka niewykonana, blokada 7 dni wieku konta Cloudflare już minęła.

**Korekta z tego samego dnia:** Michał NIE dostanie panelu — zmiany podsyła Kacprowi
[[decision-tryb-pracy]]. Scenariusz „wieczór klikania gasi stronę" odpada, kredyty zjada tylko
nasze wypychanie zmian. Przeprowadzka nadal jest potrzebna, ale z jednego powodu: bez niej nie
da się włączyć odświeżania postów z Facebooka dwa razy dziennie.
Powiązane: [[decision-pages-cms]], [[status]]

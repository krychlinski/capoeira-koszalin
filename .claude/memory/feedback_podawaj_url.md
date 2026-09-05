---
name: feedback-podawaj-url
description: Przy każdej zmianie w wyglądzie podaj adres localhost, pod którym można ją obejrzeć
metadata:
  type: feedback
---

Kończąc opis zmiany na stronie, zawsze podaj adres serwera deweloperskiego,
pod którym Kacper ma to obejrzeć — nie zakładaj, że pamięta port z wcześniejszej
wiadomości.

**Dlaczego:** portów nazbierało się kiedyś dziewiętnaście (4321–4339), bo każdy
`npm run dev` brał kolejny wolny. Kacper nie wie, który z nich jest aktualny,
a stare serwery pokazują nieaktualną treść i wyglądają jak regresja.

**Jak stosować:** trzymaj serwer na stałym porcie `4321`
(`npx astro dev --port 4321`), przed odpowiedzią sprawdź, że odpowiada, i podaj
`http://localhost:4321` w bloku kodu. Zanim postawisz nowy, ubij stare:
`pkill -f 'capoeira-koszalin/node_modules/astro/bin/astro'`.
Po czyszczącym buildzie (`build:czysty` kasuje `.astro`) serwer trzeba
zrestartować — patrz [[status]].

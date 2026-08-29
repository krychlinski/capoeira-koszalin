---
description: Dodaj nowy wpis do Aktualności na podstawie krótkiego opisu
---

Napisz nowy wpis do `src/content/aktualnosci/`.

Zasady:

- Nazwa pliku: `RRRR-MM-DD-slug.md`, slug bez polskich znaków.
- Frontmatter: `tytul`, `data`, `zajawka` (1–2 zdania, to widać na liście), `zdjecie` (może być puste),
  `opublikowany: true`.
- Ton: zwięzły, po polsku, bez marketingowego nadęcia. Piszemy do rodziców i osób, które
  zastanawiają się nad przyjściem na trening.
- Nie wymyślaj faktów — dat, nazwisk, wyników, miejsc. Czego nie wiesz, oznacz jako
  `DO UZUPEŁNIENIA` i wypisz na końcu, o co trzeba dopytać.
- Po zapisaniu uruchom `npm run build`, żeby sprawdzić, czy schemat się zgadza.

Nie commituj bez wyraźnej prośby.

---
description: Dodaj nowy wpis do Aktualności na podstawie krótkiego opisu
---

Napisz nowy wpis do `src/content/news/` (na stronie trafi pod `/aktualnosci/`).

Zasady:

- Nazwa pliku: `RRRR-MM-DD-slug.md`, slug po polsku, ale bez polskich znaków — wchodzi w adres.
- Frontmatter (nazwy pól po angielsku, jak w `src/content.config.ts`): `title`, `date`,
  `excerpt` (1–2 zdania, to widać na liście), `image` (może być puste, format `/media/plik.webp`),
  `published: true`.
- Ton: zwięzły, po polsku, bez marketingowego nadęcia. Piszemy do rodziców i osób, które
  zastanawiają się nad przyjściem na trening.
- Nie wymyślaj faktów — dat, nazwisk, wyników, miejsc. Czego nie wiesz, oznacz jako
  `DO UZUPEŁNIENIA` i wypisz na końcu, o co trzeba dopytać.
- Po zapisaniu uruchom `npm run build`, żeby sprawdzić, czy schemat się zgadza.

Nie commituj bez wyraźnej prośby.

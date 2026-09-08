---
name: reference-refaktor-nazw
description: Jak przeprowadzono zmianę nazw na angielskie i jakie pułapki wyszły — do powtórzenia przy podobnych zmianach masowych
metadata:
  type: reference
---

Refaktor 2026-09-07/08: ~3150 wierszy, 34 pliki, 155 klas CSS, 18 zmiennych CSS, 37 plików treści.
Zrobiony jednorazowym narzędziem, nie ręcznie. Podział na dwa commity: kod i dane osobno,
style osobno.

## Weryfikacja, która to uratowała

**Migawka tekstu.** Przed zmianą zapisz tekst każdej podstrony z `dist` (znaczniki wycięte),
po zmianie porównaj. Wyłapało siedem usterek, których budowanie nie widziało — zniknięte
nadtytuły, pusty cennik, ucięte godziny w grafiku, angielskie słowa wstawione w polskie zdania.

**Porównanie z poprzednim commitem przez `git worktree`.** Przy stylach: zbuduj starą wersję
w osobnej kopii roboczej, w jej gotowym HTML-u przelicz nazwy klas według mapy i porównaj
z nowym buildem. Wynik „25 z 25 identycznych" dowodzi nie tylko zgodności nazw, ale i tego,
że każda klasa siedzi na tym samym elemencie. To wykryło ostatnią usterkę.

## Pułapki, wszystkie napotkane naprawdę

1. **Bloki `{ }` w `<script>`** wyglądają jak wyrażenia szablonu Astro. Narzędzie podmieniło
   w nich identyfikatory i **rozbiło lightbox oraz wygaszanie komunikatu**. Ani budowanie, ani
   porównanie tekstu tego nie widzi — trzeba kliknąć w przeglądarce.
2. **Atrybuty `data-*` kontra selektory w skryptach.** Element dostał `data-notice`, a skrypt
   dalej szukał `[data-komunikat]`. Cichy błąd. Po każdej takiej zmianie porównaj oba zbiory.
3. **`data:image/svg+xml` w CSS.** Mapa `data`→`date` zamieniła adres obrazka na `date:image…`.
   Przy podmianach chroń ten ciąg.
4. **`class="znak"` w pliku `.md`.** Znaki UNICAR i TKKF na „O nas" są wstawione wprost
   w treści, a narzędzie chodziło tylko po `.astro` i `.css` — straciłyby formatowanie.
   **Treść też potrafi zawierać klasy.**
5. **Nazwy komponentów w widocznym tekście.** `\bGrafik\b` trafiło w napis „Grafik zajęć"
   w stopce i zrobiło z niego „Schedule zajęć".
6. **`class={wyrażenie}`** nie jest ani `class="…"`, ani `class:list` — łatwo pominąć.

Powiązane: [[decision-nazewnictwo]]

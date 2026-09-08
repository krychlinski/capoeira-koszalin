---
name: decision-nazewnictwo
description: Nazwy w kodzie po angielsku, komentarze po polsku — i co świadomie zostało polskie
metadata:
  type: feedback
---

Ustalone 2026-09-07/08. **Wszystko, co jest nazwą w kodzie, jest po angielsku.** Funkcje,
zmienne, typy, nazwy plików, kolekcje treści, pola we frontmatterze, klasy CSS i zmienne CSS.

**Po polsku zostają, świadomie:**

- **Komentarze.** Kacper wprost o to prosił.
- **Adresy stron** — `/aktualnosci/`, `/o-nas/`, `/pierwszy-trening/`. Są publiczne, w
  wyszukiwarkach i na materiałach klubu. Nazwy plików w `src/pages/` też, bo to one tworzą adresy.
- **Nazwy plików treści** (`src/content/faq/co-zabrac.md`) — wchodzą w adresy podstron.
- **Terminy capoeiry:** `apelido`, `corda`, `roda`, `axé`. To nazwy własne z portugalskiego,
  nie polszczyzna do przetłumaczenia.
- **Etykiety w `.pages.yml`** (`label:`) — to widzi redaktor w panelu.

**Jak stosować:** dokładając cokolwiek nowego, trzymaj ten podział. Nowa klasa CSS po angielsku,
komentarz nad nią po polsku.

Powiązane: [[reference-refaktor-nazw]]

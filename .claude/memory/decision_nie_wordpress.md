---
name: decision-nie-wordpress
description: Dlaczego strona capoeiry nie jest na WordPressie ani na własnym Dockerze
metadata:
  type: project
---

Stara strona `capoeira.koszalin.pl` to WordPress, którego nie dało się aktualizować. Właściciel
odchodzi od niego nie dlatego, że „stary CMS", tylko dlatego, że **nie chce już niczego łatać**.

WordPress w Dockerze na własnym VPS-ie został świadomie odrzucony: resetuje licznik, ale nie
zdejmuje bieżni aktualizacji. Odrzucono też Storybloka (darmowy plan = 1 użytkownik) i rozważano
Sanity (20 miejsc za darmo), ale ostatecznie wystarczył model git-based, bo edytorem jest jedna
osoba obeznana z WordPressem.

**Dlaczego to ważne:** nie proponuj powrotu do WordPressa, samodzielnego hostingu CMS-a ani
niczego, co wymaga regularnych aktualizacji bezpieczeństwa. To jest główne kryterium projektu.

**Jak stosować:** przy każdej nowej funkcji pytaj najpierw, czy da się ją zrobić statycznie.
Powiązane: [[todo-oauth-cms]]

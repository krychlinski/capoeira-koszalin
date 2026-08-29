---
description: Zaimportuj zdjęcia z podanego katalogu do src/assets/media — zmniejsz, przekonwertuj i nadaj czytelne nazwy
---

Zaimportuj zdjęcia do galerii. Argument to ścieżka do katalogu ze zdjęciami (np. `~/Desktop/batizado`).

Kroki:

1. Policz pliki i sprawdź ich łączny rozmiar. Jeśli jakikolwiek plik przekracza 1 MB albo
   szerokość 2400 px — trzeba go przeskalować, zdjęcia prosto z aparatu są za ciężkie do repo.
2. Przeskaluj do maks. 2400 px dłuższego boku i zapisz jako `.webp` z jakością 82.
   Użyj `sips` (jest w macOS) albo `magick`, jeśli ImageMagick jest zainstalowany.
3. Nazwij pliki `<slug-albumu>-01.webp`, `<slug-albumu>-02.webp`, … — bez spacji, polskich znaków
   i wielkich liter. Nazwa pliku jest kluczem, po którym `src/lib/media.ts` odnajduje obraz.
4. Skopiuj wynik do `src/assets/media/`.
5. Utwórz wpis albumu w `src/content/galeria/<slug>.md` z polami `tytul`, `data`, `okladka`
   i listą `zdjecia` w formacie `/media/<nazwa>.webp`.
6. Uruchom `npm run build` i zgłoś, ile zdjęć doszło oraz ile waży teraz katalog `src/assets/media`.

Nie commituj — pokaż wynik i poczekaj na decyzję.

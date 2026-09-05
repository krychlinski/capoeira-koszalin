---
name: reference-znaki-svg
description: Loga z MATERIAŁÓW mają płótno wielokrotnie większe od rysunku — przycinać viewBox; jak ustawiać znak przy akapicie
metadata:
  type: reference
---

## Płótno SVG bywa wielokrotnie większe od rysunku

Oba znaki wyeksportowane z Illustratora miały ogromne marginesy: UNICAR rysunek 533×425
w płótnie 916×667, TKKF rysunek 585×644 w płótnie **A4** 595×842. Przy 68 px szerokości
kafelka sam znak UNICAR miał realnie 40 px i wyglądał jak plamka.

**Nie skaluj w CSS na oślep — przytnij `viewBox`.** Obrys rysunku zmierz w przeglądarce
(`svg.getBBox()`), dodaj cztery jednostki luzu, wpisz jako nowy `viewBox`. Rysunek zostaje
nietknięty, zmienia się tylko okno. Do PNG (favicon) renderuje `inkscape`, jest na maszynie:
`inkscape plik.svg --export-type=png --export-filename=out.png --export-width=512 --export-height=512 --export-background-opacity=0`

Wartości po przycięciu: `unicar.svg` → `241.31 62.89 541.47 541.47` (kwadrat obejmuje też
berimbau wystające w prawy górny róg — sama pieczęć to okrąg 425×425, ale obcięcie berimbau
to zmiana cudzego znaku, nie robić bez zgody). `tkkf.svg` → `0.93 94.72 593.40 652.45`.

## Znak przy akapicie w treści — klasa `.znak`

W `global.css`. Znak jest wyjęty z akapitu (`position: absolute`), akapit ma wcięcie z lewej
i `align-content: center`, przez co znak i tekst mają wspólną oś w pionie.

**Nie rób z akapitu układu kolumnowego (flex/grid).** Każdy element wewnątrz akapitu staje się
wtedy osobną kolumną i tekst rozpada się na kawałki na każdym pogrubieniu — sprawdzone,
wyglądało to jak rozsypana tabela.

Poniżej 560 px znak idzie nad tekst: obok zostawał wiersz szerokości 29 znaków.

"""Buduje statyczną mapkę okolicy Akademii z kafelków OpenStreetMap.

Kafelki pobierane są RAZ, przy ręcznym uruchomieniu, a wynik ląduje w repozytorium.
Strona nie odpytuje więc w czasie działania żadnego serwera map — a to warunek,
na którym stoi treść /prywatnosc/.

Pinezki tu nie ma: rysuje ją komponent Map.astro jako SVG, dzięki czemu jest ostra
w każdej skali i bierze kolor wprost ze zmiennej --accent.

Uruchomienie:  python3 scripts/render-map.py
"""

import math
import os
import tempfile
import urllib.request
from PIL import Image, ImageEnhance

# Karola Szymanowskiego 16B, Koszalin — potwierdzone w OpenStreetMap.
LAT, LON = 54.1928644, 16.2033188
# Zoom 18, nie 17: przy 17 nazwy ulic były za drobne. Kadr to wtedy 391 x 266 m —
# wystarczy, żeby się zorientować, a dalszą nawigację i tak przejmują Mapy Google
# po kliknięciu.
ZOOM = 18
WIDTH, HEIGHT = 1120, 760
OUT = "src/assets/map.png"

# Mapy NIE przemalowujemy na ciemno — patrz komentarz niżej. Przygaszamy ją
# tylko w całości i lekko podbijamy nasycenie, żeby nie była szarą plamą.
#
# Przygaszenie w całości jest bezpieczne dla tekstu: czerń liter zostaje czernią,
# a biała obwódka schodzi do szarości, więc kontrast się utrzymuje. Przy 0.62
# napis ma jeszcze ~8:1; przy 0.46 spada do ~4,5:1 i robi się męczący.
BRIGHTNESS = 0.62
SATURATION = 1.2

# Napisy w kafelkach mają na sztywno ~11 px i nie da się ich powiększyć u źródła —
# to jedyny sposób, żeby urosły. Powiększenie jest łagodne, więc LANCZOS plus
# delikatne wyostrzenie wystarczają; mocniejsze zaczyna rozmywać litery.
SCALE = 1.25
SHARPEN = 1.3

UA = "capoeira-koszalin-static-map/1.0 (+https://www.capoeira.koszalin.pl)"

# Kafelki lądują w katalogu tymczasowym, żeby dobieranie tonów nie oznaczało
# ściągania ich od nowa — polityka OSM zabrania hurtu.
CACHE = os.path.join(tempfile.gettempdir(), "osm-tiles-capoeira")


def project(lat, lon, zoom):
    """Współrzędne geograficzne na piksele w siatce kafelków danego przybliżenia."""
    n = 2 ** zoom
    x = (lon + 180.0) / 360.0 * n
    rad = math.radians(lat)
    y = (1.0 - math.log(math.tan(rad) + 1.0 / math.cos(rad)) / math.pi) / 2.0 * n
    return x * 256.0, y * 256.0


def fetch(z, x, y):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"{z}-{x}-{y}.png")
    if not os.path.exists(path):
        url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            with open(path, "wb") as f:
                f.write(r.read())
    return Image.open(path).convert("RGB")


def main():
    px, py = project(LAT, LON, ZOOM)
    left, top = px - WIDTH / 2, py - HEIGHT / 2

    tx0, ty0 = int(left // 256), int(top // 256)
    tx1, ty1 = int((left + WIDTH) // 256), int((top + HEIGHT) // 256)

    canvas = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            canvas.paste(fetch(ZOOM, tx, ty), ((tx - tx0) * 256, (ty - ty0) * 256))
    print(f"złożono {(tx1 - tx0 + 1) * (ty1 - ty0 + 1)} kafelków")

    ox, oy = int(left - tx0 * 256), int(top - ty0 * 256)
    crop = canvas.crop((ox, oy, ox + WIDTH, oy + HEIGHT))

    big = crop.resize((round(WIDTH * SCALE), round(HEIGHT * SCALE)), Image.LANCZOS)
    big = ImageEnhance.Sharpness(big).enhance(SHARPEN)

    tinted = ImageEnhance.Color(big).enhance(SATURATION)
    ImageEnhance.Brightness(tinted).enhance(BRIGHTNESS).save(OUT)
    print(f"zapisano {OUT} ({big.width}×{big.height})")


main()

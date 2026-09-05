import { existsSync } from 'node:fs';
import { getCollection } from 'astro:content';
import { pobierzPosty, skroc, rozbij } from './facebook';
import { naBloki, bezZnacznikow } from './tresc';

export interface Wpis {
  href: string;
  tytul: string;
  data: Date;
  zajawka?: string;
  /** Ścieżki do zdjęć leżących w public/media/fb — pierwsze trafia na kafel. */
  zdjecia: string[];
  /** Zdjęcie z kolekcji, przechodzące przez optymalizator Astro. */
  zdjecie?: string;
  /** Odnośnik do oryginału na Facebooku — tylko dla postów stamtąd. */
  zrodloFb?: string;
  /** Pierwsze pozycje wypunktowania, gdy wpis zaczyna się listą. */
  punkty?: string[];
  pelnaTresc?: string;
}

/**
 * Łączy ręcznie pisane aktualności z postami z Facebooka w jeden strumień.
 *
 * Każdy wpis prowadzi do podstrony na naszej domenie, także facebookowy —
 * kliknięcie kafla nie wyrzuca nikogo poza serwis. Odnośnik do oryginału
 * jest dopiero w szczegółach.
 */
export async function wszystkieAktualnosci(): Promise<Wpis[]> {
  const reczne = (await getCollection('aktualnosci'))
    .filter((a) => a.data.opublikowany)
    .map((a) => ({
      href: `/aktualnosci/${a.id}/`,
      tytul: a.data.tytul,
      data: a.data.data,
      zajawka: a.data.zajawka,
      zdjecia: [],
      zdjecie: a.data.zdjecie,
    }));

  const zFacebooka = (await pobierzPosty()).map((p) => {
    const { tytul, reszta } = rozbij(p.tresc);
    // Kafel pokazuje wypunktowanie tak samo jak wpis, o ile wpis się nim zaczyna —
    // sklejone w jeden akapit plany zajęć były nieczytelne. Dla zwykłego tekstu
    // zostaje skrócona zajawka.
    const pierwszy = naBloki(reszta)[0];
    const punkty =
      pierwszy?.typ === 'lista'
        ? pierwszy.pozycje.slice(0, 4).map((poz) => {
            const { tekst, obciety } = skroc(poz.tekst, 70);
            return tekst + (obciety ? '…' : '');
          })
        : undefined;
    const { tekst, obciety } = skroc(bezZnacznikow(reszta), 160);
    return {
      href: `/aktualnosci/fb/${p.id}/`,
      tytul,
      data: p.data,
      punkty,
      zajawka: punkty || !reszta ? undefined : tekst + (obciety ? '…' : ''),
      // Liczba zdjęć z API to obietnica, nie fakt — pobranie mogło się nie udać.
      // Pokazujemy wyłącznie pliki, które naprawdę są na dysku, żeby zamiast
      // fotografii nie pojawiła się ikona zepsutego obrazka.
      zdjecia: Array.from({ length: p.liczbaZdjec }, (_, i) => `/media/fb/${p.id}-${i}.jpg`).filter(
        (sciezka) => existsSync(`public${sciezka}`)
      ),
      zrodloFb: p.odnosnik,
      pelnaTresc: p.tresc,
    };
  });

  return [...reczne, ...zFacebooka].sort((a, b) => b.data.getTime() - a.data.getTime());
}

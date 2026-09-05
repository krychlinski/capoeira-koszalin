export interface Pozycja {
  tekst: string;
  /** Pozycje wcięte myślnikiem pod pozycją gwiazdkową. */
  pod: string[];
}

export type Blok =
  | { typ: 'akapit'; tekst: string }
  | { typ: 'lista'; numerowana: boolean; pozycje: Pozycja[] };

const GWIAZDKA = /^[*•]\s*/;
const MYSLNIK = /^[-–—]\s+/;
const NUMER = /^\d{1,2}[.)]\s+/;

/**
 * Rozpoznaje wypunktowania w treści posta z Facebooka.
 *
 * Facebook nie ma formatowania, więc klub wypisuje grupy i godziny gwiazdkami
 * albo myślnikami. Przepisane wprost do akapitów wyglądały jak zlepek wierszy
 * zaczynających się od gwiazdki.
 *
 * Myślnik pod otwartą listą gwiazdkową traktujemy jako wcięcie — tak właśnie
 * zapisywany jest plan zajęć: dzień gwiazdką, grupy pod nim myślnikami. Poza
 * taką listą myślnik zaczyna własne wypunktowanie.
 *
 * Wynik to dane, a nie HTML: treść z Facebooka wstawiamy potem jako tekst,
 * więc znaczniki z posta nie mają jak trafić na stronę.
 */
export function naBloki(tresc: string): Blok[] {
  const bloki: Blok[] = [];
  let lista: Extract<Blok, { typ: 'lista' }> | null = null;
  let ostatniaNadrzedna: Pozycja | null = null;

  const otworz = (numerowana: boolean) => {
    if (!lista || lista.numerowana !== numerowana) {
      lista = { typ: 'lista', numerowana, pozycje: [] };
      bloki.push(lista);
    }
    return lista;
  };

  const dodaj = (numerowana: boolean, tekst: string) => {
    const pozycja: Pozycja = { tekst, pod: [] };
    otworz(numerowana).pozycje.push(pozycja);
    ostatniaNadrzedna = pozycja;
  };

  for (const wiersz of tresc.split('\n').map((l) => l.trim())) {
    if (!wiersz) continue;

    if (NUMER.test(wiersz)) {
      dodaj(true, wiersz.replace(NUMER, ''));
      continue;
    }

    if (GWIAZDKA.test(wiersz)) {
      dodaj(false, wiersz.replace(GWIAZDKA, ''));
      continue;
    }

    if (MYSLNIK.test(wiersz)) {
      const tekst = wiersz.replace(MYSLNIK, '');
      // Wcinamy tylko pod pozycję z gwiazdki albo numeru. Ciąg samych myślników
      // to jedno wypunktowanie, a nie pierwsza pozycja i reszta wcięta pod nią.
      if (ostatniaNadrzedna) ostatniaNadrzedna.pod.push(tekst);
      else {
        const pozycja: Pozycja = { tekst, pod: [] };
        otworz(false).pozycje.push(pozycja);
      }
      continue;
    }

    lista = null;
    ostatniaNadrzedna = null;
    bloki.push({ typ: 'akapit', tekst: wiersz });
  }

  return bloki;
}

/** Treść bez znaczników wypunktowania — do zajawek i opisów dla wyszukiwarek. */
export function bezZnacznikow(tresc: string): string {
  return tresc
    .split('\n')
    .map((l) => l.trim().replace(GWIAZDKA, '').replace(MYSLNIK, '').replace(NUMER, ''))
    .filter(Boolean)
    .join(' ');
}

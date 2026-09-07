export interface ListItem {
  text: string;
  /** Pozycje wcięte myślnikiem pod pozycją gwiazdkową. */
  children: string[];
}

export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: ListItem[] };

const BULLET = /^[*•]\s*/;
const DASH = /^[-–—]\s+/;
const NUMBERED = /^\d{1,2}[.)]\s+/;

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
export function toBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let list: Extract<Block, { type: 'list' }> | null = null;
  let lastParent: ListItem | null = null;

  const openList = (ordered: boolean) => {
    if (!list || list.ordered !== ordered) {
      list = { type: 'list', ordered, items: [] };
      blocks.push(list);
    }
    return list;
  };

  const addItem = (ordered: boolean, text: string) => {
    const item: ListItem = { text, children: [] };
    openList(ordered).items.push(item);
    lastParent = item;
  };

  for (const line of source.split('\n').map((l) => l.trim())) {
    if (!line) continue;

    if (NUMBERED.test(line)) {
      addItem(true, line.replace(NUMBERED, ''));
      continue;
    }

    if (BULLET.test(line)) {
      addItem(false, line.replace(BULLET, ''));
      continue;
    }

    if (DASH.test(line)) {
      const text = line.replace(DASH, '');
      // Wcinamy tylko pod pozycję z gwiazdki albo numeru. Ciąg samych myślników
      // to jedno wypunktowanie, a nie pierwsza pozycja i reszta wcięta pod nią.
      if (lastParent) lastParent.children.push(text);
      else openList(false).items.push({ text, children: [] });
      continue;
    }

    list = null;
    lastParent = null;
    blocks.push({ type: 'paragraph', text: line });
  }

  return blocks;
}

/** Treść bez znaczników wypunktowania — do zajawek i opisów dla wyszukiwarek. */
export function stripMarkers(source: string): string {
  return source
    .split('\n')
    .map((l) => l.trim().replace(BULLET, '').replace(DASH, '').replace(NUMBERED, ''))
    .filter(Boolean)
    .join(' ');
}

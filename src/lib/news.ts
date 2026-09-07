import { existsSync } from 'node:fs';
import { getCollection } from 'astro:content';
import { fetchPosts, truncate, splitTitle } from './facebook';
import { toBlocks, stripMarkers } from './blocks';

export interface NewsEntry {
  href: string;
  title: string;
  date: Date;
  excerpt?: string;
  /** Ścieżki do zdjęć leżących w public/media/fb — pierwsze trafia na kafel. */
  images: string[];
  /** Zdjęcie z kolekcji, przechodzące przez optymalizator Astro. */
  image?: string;
  /** Odnośnik do oryginału na Facebooku — tylko dla postów stamtąd. */
  facebookUrl?: string;
  /** Pierwsze pozycje wypunktowania, gdy wpis zaczyna się listą. */
  points?: string[];
  fullBody?: string;
}

/**
 * Łączy ręcznie pisane aktualności z postami z Facebooka w jeden strumień.
 *
 * Każdy wpis prowadzi do podstrony na naszej domenie, także facebookowy —
 * kliknięcie kafla nie wyrzuca nikogo poza serwis. Odnośnik do oryginału
 * jest dopiero w szczegółach.
 */
export async function allNews(): Promise<NewsEntry[]> {
  const written = (await getCollection('aktualnosci'))
    .filter((entry) => entry.data.published)
    .map((entry) => ({
      href: `/aktualnosci/${entry.id}/`,
      title: entry.data.title,
      date: entry.data.date,
      excerpt: entry.data.excerpt,
      images: [],
      image: entry.data.image,
    }));

  const fromFacebook = (await fetchPosts()).map((post) => {
    const { title, rest } = splitTitle(post.body);
    // Kafel pokazuje wypunktowanie tak samo jak wpis, o ile wpis się nim zaczyna —
    // sklejone w jeden akapit plany zajęć były nieczytelne. Dla zwykłego tekstu
    // zostaje skrócona zajawka.
    const firstBlock = toBlocks(rest)[0];
    const points =
      firstBlock?.type === 'list'
        ? firstBlock.items.slice(0, 4).map((item) => {
            const { text, truncated } = truncate(item.text, 70);
            return text + (truncated ? '…' : '');
          })
        : undefined;
    const { text, truncated } = truncate(stripMarkers(rest), 160);
    return {
      href: `/aktualnosci/fb/${post.id}/`,
      title,
      date: post.date,
      points,
      excerpt: points || !rest ? undefined : text + (truncated ? '…' : ''),
      // Liczba zdjęć z API to obietnica, nie fakt — pobranie mogło się nie udać.
      // Pokazujemy wyłącznie pliki, które naprawdę są na dysku, żeby zamiast
      // fotografii nie pojawiła się ikona zepsutego obrazka.
      images: Array.from({ length: post.imageCount }, (_, i) => `/media/fb/${post.id}-${i}.jpg`).filter(
        (path) => existsSync(`public${path}`)
      ),
      facebookUrl: post.permalink,
      fullBody: post.body,
    };
  });

  return [...written, ...fromFacebook].sort((a, b) => b.date.getTime() - a.date.getTime());
}

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DIRECTORY = 'public/media/fb';

/**
 * Cloudflare Pages odrzuca wdrożenie z plikiem powyżej 25 MiB, a wywalone
 * wdrożenie to cała strona bez nowej treści, nie jeden brakujący film.
 * Zostawiamy zapas: 20 MiB to przy typowym kodowaniu Facebooka (720p, ~1 Mb/s,
 * czyli jakieś 7,5 MB na minutę) mniej więcej dwie i pół minuty nagrania.
 * Dłuższy film pomijamy — wpis pokazuje wtedy planszę i odsyła do oryginału.
 */
const MAX_VIDEO_BYTES = Number(process.env.FB_MAX_MB ?? 20) * 1024 * 1024;

async function readToken() {
  if (process.env.FB_TOKEN) return process.env.FB_TOKEN;
  // Integracje startują przed wczytaniem .env przez Vite — czytamy plik sami.
  try {
    const file = await readFile('.env', 'utf8');
    const line = file.split('\n').find((x) => x.startsWith('FB_TOKEN='));
    return line ? line.slice(9).trim() : null;
  } catch {
    return null;
  }
}

/**
 * Ściąga zdjęcia i filmy z postów na dysk PRZED budowaniem strony.
 *
 * Dlaczego nie podać Astro adresu z Facebooka wprost: te adresy są podpisane
 * i wygasają — film dostaje ważność rzędu kilku dni — więc po pewnym czasie
 * przestałyby się wyświetlać. A gdyby Astro nie zdołało pobrać pliku w trakcie
 * budowania, przerwałoby cały build — czyli awaria Facebooka kładłaby stronę.
 * Tutaj każdy błąd dotyczy jednego pliku i kończy się jego pominięciem.
 */
export default function facebookMedia() {
  return {
    name: 'facebook-media',
    hooks: {
      'astro:build:start': download,
      'astro:server:start': download,
    },
  };
}

async function download() {
  const token = await readToken();
  if (!token) return;

  const apiVersion = process.env.FB_API_VERSION ?? 'v26.0';

  // Ta sama zasada co w src/lib/facebook.ts: przyjmujemy token użytkownika
  // albo strony i sami rozstrzygamy, którym trzeba się posłużyć.
  let pageId = process.env.FB_STRONA ?? 'me';
  let pageToken = token;
  try {
    const accounts = await (
      await fetch(`https://graph.facebook.com/${apiVersion}/me/accounts?access_token=${token}`)
    ).json();
    const page = accounts?.data?.[0];
    if (page?.access_token && page?.id) {
      pageId = page.id;
      pageToken = page.access_token;
    }
  } catch {
    // zostajemy przy tym, co podano
  }
  const days = Number(process.env.FB_DNI ?? 31);
  const minimum = Number(process.env.FB_MINIMUM ?? 12);

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${pageId}/posts` +
        `?fields=id,message,created_time,full_picture,attachments{type,media,subattachments{type,media}}` +
        `&limit=50&access_token=${pageToken}`
    );
    if (!response.ok) {
      console.warn(`[facebook-media] ${response.status} — pomijam zdjęcia i filmy`);
      return;
    }
    const data = await response.json();

    // Ta sama reguła co imageUrls w src/lib/facebook.ts: album zwraca zdjęcia
    // w subattachments, pojedyncze zdjęcie w media. Podglądy linków, udostępnione
    // posty i wydarzenia pomijamy — ich obrazek to kadr wycięty przez Facebooka.
    // Film ma własną ścieżkę niżej: tam kadr jest właśnie tym, czego chcemy.
    const urls = (post) => {
      const attachment = post?.attachments?.data?.[0];
      if (attachment?.type === 'album') {
        return (attachment.subattachments?.data ?? [])
          .filter((s) => s?.type === 'photo')
          .map((s) => s?.media?.image?.src)
          .filter(Boolean);
      }
      if (attachment?.type === 'photo') {
        const single = attachment.media?.image?.src ?? post?.full_picture;
        return single ? [single] : [];
      }
      return [];
    };

    // Ta sama reguła co videoSource w src/lib/facebook.ts: film siedzi w media.source,
    // a media.image jest jego kadrem — przy filmie to właściwa plansza, nie przycięty
    // podgląd. Facebook nazywa ten załącznik różnie zależnie od tego, jak wstawiono
    // nagranie, więc dopuszczamy każdy typ zaczynający się od „video”.
    const video = (post) => {
      const attachment = post?.attachments?.data?.[0];
      if (!attachment?.type?.startsWith('video')) return null;
      const source = attachment.media?.source;
      if (typeof source !== 'string') return null;
      return { source, poster: attachment.media?.image?.src ?? post?.full_picture ?? null };
    };

    // Ta sama reguła co w src/lib/facebook.ts (funkcja selectPosts): wszystko
    // z ostatnich `days`, a gdy tego mniej niż `minimum`, dobieramy starsze.
    // Obie muszą wybierać identycznie, inaczej część postów zostanie bez zdjęć.
    // Strona pokazuje wyłącznie posty z tekstem, więc wybór musi startować
    // z tej samej listy. Bez tego filtra integracja liczyła też posty bez treści
    // i sięgała płycej w czasie niż strona — najstarsze kafle zostawały bez zdjęć.
    const posts = (data.data ?? []).filter(
      (p) => typeof p.message === 'string' && p.message.trim()
    );
    const cutoff = Date.now() - days * 86_400_000;
    const recent = posts.filter((p) => new Date(p.created_time).getTime() >= cutoff);
    const selected = recent.length >= minimum ? recent : posts.slice(0, minimum);

    await mkdir(DIRECTORY, { recursive: true });
    let total = 0;
    let fresh = 0;
    let films = 0;
    for (const post of selected) {
      const list = urls(post);
      total += list.length;
      for (const [i, url] of list.entries()) {
        const file = `${DIRECTORY}/${post.id}-${i}.jpg`;
        if (existsSync(file)) continue;
        try {
          const image = await fetch(url);
          if (!image.ok) continue;
          await writeFile(file, Buffer.from(await image.arrayBuffer()));
          fresh++;
        } catch {
          // jeden obrazek mniej nie jest powodem, żeby przerywać build
        }
      }

      const film = video(post);
      if (!film) continue;
      films++;
      // Kadr pobieramy zawsze — gdy film odpadnie przez rozmiar, zostaje plansza
      // z odnośnikiem do oryginału zamiast pustego miejsca.
      const posterFile = `${DIRECTORY}/${post.id}-video.jpg`;
      if (film.poster && !existsSync(posterFile)) {
        try {
          const poster = await fetch(film.poster);
          if (poster.ok) await writeFile(posterFile, Buffer.from(await poster.arrayBuffer()));
        } catch {
          // plansza to ozdoba, film obroni się bez niej
        }
      }

      const videoFile = `${DIRECTORY}/${post.id}-video.mp4`;
      if (existsSync(videoFile)) continue;
      try {
        const bytes = await fetchCapped(film.source, MAX_VIDEO_BYTES);
        if (bytes) await writeFile(videoFile, bytes);
        else console.warn(`[facebook-media] film ${post.id} nie mieści się w limicie — zostaje plansza`);
      } catch {
        // brak filmu zostawia sam kadr — wpis nadal się wyświetli
      }
    }
    console.log(`[facebook-media] zdjęć: ${total}, pobrano nowych: ${fresh}, filmów: ${films}`);
  } catch (e) {
    console.warn('[facebook-media] pominięte:', e.message);
  }
}

/**
 * Pobiera plik, ale nigdy więcej niż `limit` bajtów.
 *
 * Najpierw pyta HEAD-em o rozmiar, bo przy długim filmie pozwala to odpuścić
 * pobieranie w całości. Facebook nie zawsze podaje content-length, więc samo to
 * nie wystarcza: strumień liczymy po drodze i przerywamy po przekroczeniu limitu.
 * Bez tego jedno dłuższe nagranie wciągałoby kilkaset megabajtów do pamięci
 * runnera przy każdym z kilkunastu dziennych budowań.
 *
 * Zwraca `null`, gdy plik jest za duży albo serwer odmówił.
 */
async function fetchCapped(url, limit) {
  try {
    const head = await fetch(url, { method: 'HEAD' });
    const declared = Number(head.headers.get('content-length') ?? 0);
    if (declared > limit) return null;
  } catch {
    // brak HEAD-a nie przeszkadza — rozmiar i tak pilnujemy niżej
  }

  const response = await fetch(url);
  if (!response.ok || !response.body) return null;

  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) {
      await response.body.cancel?.();
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

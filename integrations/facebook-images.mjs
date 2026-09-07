import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DIRECTORY = 'public/media/fb';

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
 * Ściąga zdjęcia z postów na dysk PRZED budowaniem strony.
 *
 * Dlaczego nie podać Astro adresu z Facebooka wprost: te adresy są podpisane
 * i wygasają, więc zdjęcia po pewnym czasie przestałyby się wyświetlać.
 * A gdyby Astro nie zdołało pobrać obrazka w trakcie budowania, przerwałoby
 * cały build — czyli awaria Facebooka kładłaby stronę. Tutaj każdy błąd
 * dotyczy jednego pliku i kończy się jego pominięciem.
 */
export default function facebookImages() {
  return {
    name: 'facebook-images',
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
        `?fields=id,message,created_time,full_picture,attachments{type,media,subattachments{media}}` +
        `&limit=50&access_token=${pageToken}`
    );
    if (!response.ok) {
      console.warn(`[facebook-images] ${response.status} — pomijam zdjęcia`);
      return;
    }
    const data = await response.json();

    // Album zwraca zdjęcia w subattachments, pojedyncze zdjęcie w media.
    const urls = (post) => {
      const attachment = post?.attachments?.data?.[0];
      const sub = attachment?.subattachments?.data ?? [];
      const fromAlbum = sub.map((s) => s?.media?.image?.src).filter(Boolean);
      if (fromAlbum.length) return fromAlbum;
      const single = attachment?.media?.image?.src ?? post?.full_picture;
      return single ? [single] : [];
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
    }
    console.log(`[facebook-images] zdjęć: ${total}, pobrano nowych: ${fresh}`);
  } catch (e) {
    console.warn('[facebook-images] pominięte:', e.message);
  }
}

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const KATALOG = 'public/media/fb';

async function token() {
  if (process.env.FB_TOKEN) return process.env.FB_TOKEN;
  // Integracje startują przed wczytaniem .env przez Vite — czytamy plik sami.
  try {
    const t = await readFile('.env', 'utf8');
    const l = t.split('\n').find((x) => x.startsWith('FB_TOKEN='));
    return l ? l.slice(9).trim() : null;
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
export default function obrazkiFacebooka() {
  return {
    name: 'obrazki-fb',
    hooks: {
      'astro:build:start': pobierz,
      'astro:server:start': pobierz,
    },
  };
}

async function pobierz() {
  const TOKEN = await token();
  if (!TOKEN) return;

  const wersja = process.env.FB_API_VERSION ?? 'v26.0';

  // Ta sama zasada co w src/lib/facebook.ts: przyjmujemy token użytkownika
  // albo strony i sami rozstrzygamy, którym trzeba się posłużyć.
  let strona = process.env.FB_STRONA ?? 'me';
  let klucz = TOKEN;
  try {
    const a = await (await fetch(`https://graph.facebook.com/${wersja}/me/accounts?access_token=${TOKEN}`)).json();
    const s = a?.data?.[0];
    if (s?.access_token && s?.id) { strona = s.id; klucz = s.access_token; }
  } catch {
    // zostajemy przy tym, co podano
  }
  const dni = Number(process.env.FB_DNI ?? 31);
  const minimum = Number(process.env.FB_MINIMUM ?? 12);

  try {
    const r = await fetch(
      `https://graph.facebook.com/${wersja}/${strona}/posts` +
        `?fields=id,message,created_time,full_picture,attachments{type,media,subattachments{media}}` +
        `&limit=50&access_token=${klucz}`
    );
    if (!r.ok) {
      console.warn(`[obrazki-fb] ${r.status} — pomijam zdjęcia`);
      return;
    }
    const dane = await r.json();

    // Album zwraca zdjęcia w subattachments, pojedyncze zdjęcie w media.
    const adresy = (p) => {
      const a = p?.attachments?.data?.[0];
      const pod = a?.subattachments?.data ?? [];
      const zAlbumu = pod.map((s) => s?.media?.image?.src).filter(Boolean);
      if (zAlbumu.length) return zAlbumu;
      const jeden = a?.media?.image?.src ?? p?.full_picture;
      return jeden ? [jeden] : [];
    };

    // Ta sama reguła co w src/lib/facebook.ts (funkcja wybierz): wszystko
    // z ostatnich `dni`, a gdy tego mniej niż `minimum`, dobieramy starsze.
    // Obie muszą wybierać identycznie, inaczej część postów zostanie bez zdjęć.
    // Strona pokazuje wyłącznie posty z tekstem, więc wybór musi startować
    // z tej samej listy. Bez tego filtra integracja liczyła też posty bez treści
    // i sięgała płycej w czasie niż strona — najstarsze kafle zostawały bez zdjęć.
    const posty = (dane.data ?? []).filter(
      (p) => typeof p.message === 'string' && p.message.trim()
    );
    const granica = Date.now() - dni * 86_400_000;
    const swieze = posty.filter((p) => new Date(p.created_time).getTime() >= granica);
    const wybrane = swieze.length >= minimum ? swieze : posty.slice(0, minimum);

    await mkdir(KATALOG, { recursive: true });
    let wszystkich = 0;
    let nowe = 0;
    for (const p of wybrane) {
      const lista = adresy(p);
      wszystkich += lista.length;
      for (const [i, adres] of lista.entries()) {
        const plik = `${KATALOG}/${p.id}-${i}.jpg`;
        if (existsSync(plik)) continue;
        try {
          const o = await fetch(adres);
          if (!o.ok) continue;
          await writeFile(plik, Buffer.from(await o.arrayBuffer()));
          nowe++;
        } catch {
          // jeden obrazek mniej nie jest powodem, żeby przerywać build
        }
      }
    }
    console.log(`[obrazki-fb] zdjęć: ${wszystkich}, pobrano nowych: ${nowe}`);
  } catch (e) {
    console.warn('[obrazki-fb] pominięte:', e.message);
  }
}

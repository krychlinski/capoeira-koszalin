export interface PostFb {
  id: string;
  tresc: string;
  data: Date;
  odnosnik: string;
}

const WERSJA = import.meta.env.FB_API_VERSION ?? 'v26.0';
const TOKEN = import.meta.env.FB_TOKEN;
const STRONA = import.meta.env.FB_STRONA ?? 'CapoeiraUnicarKoszalin';
const DNI = Number(import.meta.env.FB_DNI ?? 31);

/**
 * Pobiera posty ze strony klubu na Facebooku podczas budowania.
 *
 * Awaria Facebooka, wygasły token albo jego brak NIE MOGĄ wywalić builda — strona
 * ma się zbudować i bez tego. W takim wypadku zwracamy pustą listę, a sekcja
 * z postami po prostu się nie pokaże.
 */
export async function pobierzPosty(): Promise<PostFb[]> {
  if (!TOKEN) return [];

  const od = Math.floor((Date.now() - DNI * 86_400_000) / 1000);
  const url =
    `https://graph.facebook.com/${WERSJA}/${STRONA}/posts` +
    `?fields=id,message,created_time,permalink_url` +
    `&since=${od}&limit=25&access_token=${TOKEN}`;

  try {
    const odpowiedz = await fetch(url);
    if (!odpowiedz.ok) {
      const tresc = await odpowiedz.text();
      console.warn(`[facebook] ${odpowiedz.status}: ${tresc.slice(0, 200)}`);
      return [];
    }

    const dane = await odpowiedz.json();
    if (!Array.isArray(dane?.data)) return [];

    return dane.data
      .filter((p: any) => typeof p.message === 'string' && p.message.trim())
      .map((p: any) => ({
        id: String(p.id),
        tresc: p.message.trim(),
        data: new Date(p.created_time),
        odnosnik: p.permalink_url ?? `https://www.facebook.com/${STRONA}/`,
      }));
  } catch (blad) {
    console.warn('[facebook] nie udało się pobrać postów:', (blad as Error).message);
    return [];
  }
}

/** Skraca długi post do pierwszego akapitu, resztę zostawiając na Facebooku. */
export function skroc(tresc: string, limit = 320): { tekst: string; obciety: boolean } {
  if (tresc.length <= limit) return { tekst: tresc, obciety: false };
  const ciecie = tresc.lastIndexOf(' ', limit);
  return { tekst: tresc.slice(0, ciecie > 0 ? ciecie : limit), obciety: true };
}

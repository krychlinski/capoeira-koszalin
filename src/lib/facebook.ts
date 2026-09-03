export interface PostFb {
  id: string;
  tresc: string;
  data: Date;
  odnosnik: string;
  /** Ile zdjęć pobrała integracja obrazki-fb do public/media/fb/. */
  liczbaZdjec: number;
}

const WERSJA = import.meta.env.FB_API_VERSION ?? 'v26.0';
const TOKEN = import.meta.env.FB_TOKEN;
const STRONA = import.meta.env.FB_STRONA ?? 'me';
const DNI = Number(import.meta.env.FB_DNI ?? 31);
const MINIMUM = Number(import.meta.env.FB_MINIMUM ?? 12);
const POBIERZ = 50;

/**
 * Które posty pokazujemy: wszystkie z ostatnich DNI dni, a gdyby było ich mniej
 * niż MINIMUM, dobieramy starsze do tej liczby.
 *
 * Bez tego cichy miesiąc na Facebooku zostawiałby pustą stronę aktualności.
 *
 * UWAGA: tę samą regułę stosuje integracja pobierająca zdjęcia
 * (integracje/obrazki-fb.mjs). Zmiana tutaj wymaga zmiany i tam, inaczej
 * część postów zostanie bez obrazków.
 */
export function wybierz<T extends { data: Date }>(posty: T[]): T[] {
  const granica = Date.now() - DNI * 86_400_000;
  const swieze = posty.filter((p) => p.data.getTime() >= granica);
  return swieze.length >= MINIMUM ? swieze : posty.slice(0, MINIMUM);
}

export const POLA =
  'id,message,created_time,permalink_url,full_picture,' +
  'attachments{type,media,subattachments{media}}';

/** Wyciąga adresy wszystkich zdjęć z posta — pojedynczych i całych albumów. */
export function adresyZdjec(p: any): string[] {
  const a = p?.attachments?.data?.[0];
  const pod = a?.subattachments?.data ?? [];
  const zAlbumu = pod.map((s: any) => s?.media?.image?.src).filter(Boolean);
  if (zAlbumu.length) return zAlbumu;
  const pojedyncze = a?.media?.image?.src ?? p?.full_picture;
  return pojedyncze ? [pojedyncze] : [];
}

/**
 * Ustala token strony i jej identyfikator.
 *
 * Do czytania postów Meta wymaga tokenu STRONY — token użytkownika odrzuca
 * błędem 190, nawet przy jawnym identyfikatorze. Ale token użytkownika potrafi
 * token strony wydać, więc przyjmujemy jedno i drugie i sami to rozstrzygamy.
 * Bez tego wklejenie niewłaściwego z dwóch podobnych ciągów cicho psuje feed.
 */
async function ustalStrone(): Promise<{ token: string; id: string } | null> {
  if (!TOKEN) return null;
  try {
    const r = await fetch(`https://graph.facebook.com/${WERSJA}/me/accounts?access_token=${TOKEN}`);
    const d = await r.json();
    const s = d?.data?.[0];
    if (s?.access_token && s?.id) return { token: s.access_token, id: s.id };
  } catch {
    // brak odpowiedzi traktujemy jak "to już jest token strony"
  }
  return { token: TOKEN, id: STRONA };
}

let wPamieci: Promise<PostFb[]> | null = null;

export function pobierzPosty(): Promise<PostFb[]> {
  // Strona główna i lista aktualności pytają niezależnie — bez tego build
  // odpytywałby Facebooka dwa razy zamiast raz.
  wPamieci ??= pobierz();
  return wPamieci;
}

/**
 * Pobiera posty ze strony klubu podczas budowania.
 *
 * Awaria Facebooka, wygasły token albo jego brak NIE MOGĄ wywalić builda — strona
 * ma się zbudować i bez tego. W takim wypadku zwracamy pustą listę.
 */
async function pobierz(): Promise<PostFb[]> {
  const strona = await ustalStrone();
  if (!strona) return [];

  const url =
    `https://graph.facebook.com/${WERSJA}/${strona.id}/posts` +
    `?fields=${POLA}&limit=${POBIERZ}&access_token=${strona.token}`;

  try {
    const odpowiedz = await fetch(url);
    if (!odpowiedz.ok) {
      console.warn(`[facebook] ${odpowiedz.status}: ${(await odpowiedz.text()).slice(0, 200)}`);
      return [];
    }

    const dane = await odpowiedz.json();
    if (!Array.isArray(dane?.data)) return [];

    const wszystkie = dane.data
      .filter((p: any) => typeof p.message === 'string' && p.message.trim())
      .map((p: any) => ({
        id: String(p.id),
        tresc: p.message.trim(),
        data: new Date(p.created_time),
        odnosnik: p.permalink_url ?? `https://www.facebook.com/${strona.id}/`,
        liczbaZdjec: adresyZdjec(p).length,
      }));

    return wybierz(wszystkie);
  } catch (blad) {
    console.warn('[facebook] nie udało się pobrać postów:', (blad as Error).message);
    return [];
  }
}

/** Skraca długi tekst do pełnego słowa. */
export function skroc(tresc: string, limit = 320): { tekst: string; obciety: boolean } {
  if (tresc.length <= limit) return { tekst: tresc, obciety: false };
  const ciecie = tresc.lastIndexOf(' ', limit);
  return { tekst: tresc.slice(0, ciecie > 0 ? ciecie : limit), obciety: true };
}

/** Rozbija post na tytuł kafla i resztę treści. */
export function rozbij(tresc: string): { tytul: string; reszta: string } {
  const linie = tresc
    .split('\n')
    .map((l) => l.trim().replace(/^[*•\-–]\s*/, ''))
    .filter(Boolean);
  const pierwsza = linie[0] ?? '';
  return {
    tytul: pierwsza.length > 90 ? skroc(pierwsza, 90).tekst + '…' : pierwsza,
    reszta: linie.slice(1).join('\n'),
  };
}

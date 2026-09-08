import settings from '../data/settings.json';
export interface FacebookPost {
  id: string;
  body: string;
  date: Date;
  permalink: string;
  /** Ile zdjęć pobrała integracja facebook-images do public/media/fb/. */
  imageCount: number;
}

const API_VERSION = import.meta.env.FB_API_VERSION ?? 'v26.0';
const TOKEN = import.meta.env.FB_TOKEN;
const PAGE = import.meta.env.FB_STRONA ?? 'me';
const DAYS = Number(import.meta.env.FB_DNI ?? 31);
const MINIMUM = Number(import.meta.env.FB_MINIMUM ?? 12);
const FETCH_LIMIT = 50;

/**
 * Które posty pokazujemy: wszystkie z ostatnich DAYS dni, a gdyby było ich mniej
 * niż MINIMUM, dobieramy starsze do tej liczby.
 *
 * Bez tego cichy miesiąc na Facebooku zostawiałby pustą stronę aktualności.
 *
 * UWAGA: tę samą regułę stosuje integracja pobierająca zdjęcia
 * (integrations/facebook-images.mjs). Zmiana tutaj wymaga zmiany i tam, inaczej
 * część postów zostanie bez obrazków.
 */
export function selectPosts<T extends { date: Date }>(posts: T[]): T[] {
  const cutoff = Date.now() - DAYS * 86_400_000;
  const recent = posts.filter((p) => p.date.getTime() >= cutoff);
  return recent.length >= MINIMUM ? recent : posts.slice(0, MINIMUM);
}

export const FIELDS =
  'id,message,created_time,permalink_url,full_picture,' +
  'attachments{type,media,subattachments{media}}';

/** Wyciąga adresy wszystkich zdjęć z posta — pojedynczych i całych albumów. */
export function imageUrls(post: any): string[] {
  const attachment = post?.attachments?.data?.[0];
  const sub = attachment?.subattachments?.data ?? [];
  const fromAlbum = sub.map((s: any) => s?.media?.image?.src).filter(Boolean);
  if (fromAlbum.length) return fromAlbum;
  const single = attachment?.media?.image?.src ?? post?.full_picture;
  return single ? [single] : [];
}

/**
 * Ustala token strony i jej identyfikator.
 *
 * Do czytania postów Meta wymaga tokenu STRONY — token użytkownika odrzuca
 * błędem 190, nawet przy jawnym identyfikatorze. Ale token użytkownika potrafi
 * token strony wydać, więc przyjmujemy jedno i drugie i sami to rozstrzygamy.
 * Bez tego wklejenie niewłaściwego z dwóch podobnych ciągów cicho psuje feed.
 */
async function resolvePage(): Promise<{ token: string; id: string } | null> {
  if (!TOKEN) return null;
  try {
    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/me/accounts?access_token=${TOKEN}`);
    const data = await response.json();
    const page = data?.data?.[0];
    if (page?.access_token && page?.id) return { token: page.access_token, id: page.id };
  } catch {
    // brak odpowiedzi traktujemy jak "to już jest token strony"
  }
  return { token: TOKEN, id: PAGE };
}

let cached: Promise<FacebookPost[]> | null = null;

export function fetchPosts(): Promise<FacebookPost[]> {
  // Strona główna i lista aktualności pytają niezależnie — bez tego build
  // odpytywałby Facebooka dwa razy zamiast raz.
  cached ??= load();
  return cached;
}

/**
 * Pobiera posty ze strony klubu podczas budowania.
 *
 * Awaria Facebooka, wygasły token albo jego brak NIE MOGĄ wywalić builda — strona
 * ma się zbudować i bez tego. W takim wypadku zwracamy pustą listę.
 */
async function load(): Promise<FacebookPost[]> {
  const page = await resolvePage();
  if (!page) return [];

  const url =
    `https://graph.facebook.com/${API_VERSION}/${page.id}/posts` +
    `?fields=${FIELDS}&limit=${FETCH_LIMIT}&access_token=${page.token}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[facebook] ${response.status}: ${(await response.text()).slice(0, 200)}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data?.data)) return [];

    const all = data.data
      .filter((p: any) => typeof p.message === 'string' && p.message.trim())
      .map((p: any) => ({
        id: String(p.id),
        body: p.message.trim(),
        date: new Date(p.created_time),
        permalink: permalinkFor(String(p.id), p.permalink_url),
        imageCount: imageUrls(p).length,
      }));

    return selectPosts(all);
  } catch (error) {
    console.warn('[facebook] nie udało się pobrać postów:', (error as Error).message);
    return [];
  }
}

/** Skraca długi tekst do pełnego słowa. */
export function truncate(source: string, limit = 320): { text: string; truncated: boolean } {
  if (source.length <= limit) return { text: source, truncated: false };
  const cut = source.lastIndexOf(' ', limit);
  return { text: source.slice(0, cut > 0 ? cut : limit), truncated: true };
}

/**
 * Rozbija post na tytuł kafla i resztę treści.
 *
 * Reszta zostaje surowa, ze znacznikami wypunktowania — rozpoznaje je dopiero
 * toBlocks w lib/blocks, a bez nich lista byłaby nie do odróżnienia od akapitów.
 */
/**
 * Adres wpisu na Facebooku zbudowany na NAZWIE strony, a nie na jej numerze.
 *
 * Graph API oddaje permalinki w postaci `facebook.com/1547293853862190/posts/123`.
 * iOS przechwytuje odnośniki do facebook.com i otwiera je w aplikacji Facebooka,
 * a ta regularnie nie potrafi rozwiązać adresu z numerycznym identyfikatorem —
 * pokazuje „To nie jest dostępne”, nawet gdy zalogowany ma pełny dostęp do strony.
 * Adres z nazwą (`facebook.com/CapoeiraUnicarKoszalin/posts/123`) otwiera się
 * poprawnie, bo aplikacja umie po niej trafić do strony.
 *
 * Identyfikator wpisu to druga część `post.id` (`<strona>_<wpis>`). Gdy czegokolwiek
 * brakuje, zostawiamy adres prosto z Graph API — lepszy niedziałający w aplikacji
 * niż żaden.
 */
function permalinkFor(postId: string, fromGraph?: string): string {
  const slug = settings.facebook?.match(/facebook\.com\/([^/?#]+)/)?.[1];
  const story = postId.includes('_') ? postId.split('_')[1] : null;
  if (slug && story) return `https://www.facebook.com/${slug}/posts/${story}`;
  return fromGraph ?? settings.facebook ?? 'https://www.facebook.com/';
}

export function splitTitle(source: string): { title: string; rest: string } {
  const lines = source.split('\n').map((l) => l.trim()).filter(Boolean);
  const first = (lines[0] ?? '').replace(/^[*•\-–]\s*/, '');
  return {
    title: first.length > 90 ? truncate(first, 90).text + '…' : first,
    rest: lines.slice(1).join('\n'),
  };
}

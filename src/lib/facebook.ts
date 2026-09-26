import settings from '../data/settings.json';
export interface FacebookPost {
  id: string;
  body: string;
  date: Date;
  permalink: string;
  /** Ile zdjęć pobrała integracja facebook-media do public/media/fb/. */
  imageCount: number;
  /** Czy do posta dołączono film — plik ściąga ta sama integracja. */
  hasVideo: boolean;
  /** Link udostępniony w poście — pokazujemy go jako kartkę, bez obrazka. */
  link?: FacebookLink;
}

export interface FacebookLink {
  url: string;
  domain: string;
  title?: string;
  description?: string;
}

const API_VERSION = import.meta.env.FB_API_VERSION ?? 'v26.0';
const TOKEN = import.meta.env.FB_TOKEN;
const PAGE = import.meta.env.FB_STRONA ?? 'me';
const DAYS = Number(import.meta.env.FB_DNI ?? 31);
const MINIMUM = Number(import.meta.env.FB_MINIMUM ?? 12);
const FETCH_LIMIT = 50;
/** Powyżej tylu znaków pierwsza linia przestaje być tytułem, a zaczyna być treścią. */
const TITLE_LIMIT = 90;

/**
 * Które posty pokazujemy: wszystkie z ostatnich DAYS dni, a gdyby było ich mniej
 * niż MINIMUM, dobieramy starsze do tej liczby.
 *
 * Bez tego cichy miesiąc na Facebooku zostawiałby pustą stronę aktualności.
 *
 * UWAGA: tę samą regułę stosuje integracja pobierająca zdjęcia i filmy
 * (integrations/facebook-media.mjs). Zmiana tutaj wymaga zmiany i tam, inaczej
 * część postów zostanie bez obrazków.
 */
export function selectPosts<T extends { date: Date }>(posts: T[]): T[] {
  const cutoff = Date.now() - DAYS * 86_400_000;
  const recent = posts.filter((p) => p.date.getTime() >= cutoff);
  return recent.length >= MINIMUM ? recent : posts.slice(0, MINIMUM);
}

export const FIELDS =
  'id,message,created_time,permalink_url,full_picture,' +
  'attachments{type,media,title,description,unshimmed_url,subattachments{type,media}}';

/**
 * Link z podglądem udostępniony w poście (załącznik `share`).
 *
 * Bierzemy `unshimmed_url`, czyli adres docelowy — `url` prowadzi przez
 * przekierowanie l.facebook.com. Obrazek podglądu pomijamy, bo Facebook go przycina
 * (patrz imageUrls). Adres spoza http(s) odrzucamy, żeby do strony nie trafił
 * odnośnik `javascript:`.
 */
export function linkPreview(post: any): FacebookLink | undefined {
  const attachment = post?.attachments?.data?.[0];
  if (attachment?.type !== 'share' || typeof attachment.unshimmed_url !== 'string') return undefined;
  try {
    const url = new URL(attachment.unshimmed_url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return {
      url: url.href,
      domain: url.hostname.replace(/^www\./, ''),
      title: attachment.title?.trim() || undefined,
      description: attachment.description?.trim() || undefined,
    };
  } catch {
    return undefined;
  }
}

/**
 * Wyciąga adresy zdjęć dodanych do posta — pojedynczego albo całego albumu.
 *
 * Obrazek mają też inne załączniki: podgląd linku (`share`), udostępniony post
 * (`native_templates`), wydarzenie, film. Ale to kadr wycięty przez Facebooka,
 * nie zdjęcie od klubu — podgląd strony klubu wychodził jako ucięte „APOE”.
 * Dlatego bierzemy wyłącznie typy `photo` i `album`. Film ma własną funkcję
 * (hasVideo) — tam kadr jest planszą nagrania, czyli dokładnie tym, czego chcemy.
 *
 * UWAGA: tę samą regułę powtarza integracja integrations/facebook-media.mjs.
 */
export function imageUrls(post: any): string[] {
  const attachment = post?.attachments?.data?.[0];
  if (attachment?.type === 'album') {
    return (attachment.subattachments?.data ?? [])
      .filter((s: any) => s?.type === 'photo')
      .map((s: any) => s?.media?.image?.src)
      .filter(Boolean);
  }
  if (attachment?.type === 'photo') {
    const single = attachment.media?.image?.src ?? post?.full_picture;
    return single ? [single] : [];
  }
  return [];
}

/**
 * Czy post ma film.
 *
 * Samego adresu nie przekazujemy dalej: jest podpisany i wygasa po kilku dniach,
 * więc strona odtwarza kopię pobraną przy budowaniu przez integrations/facebook-media.mjs.
 * Facebook nazywa ten załącznik różnie (`video_inline` dla rolki, `video` dla zwykłego
 * nagrania), dlatego łapiemy każdy typ zaczynający się od „video”.
 *
 * UWAGA: tę samą regułę powtarza wspomniana integracja.
 */
export function hasVideo(post: any): boolean {
  const attachment = post?.attachments?.data?.[0];
  return Boolean(attachment?.type?.startsWith('video') && typeof attachment.media?.source === 'string');
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
        hasVideo: hasVideo(p),
        link: linkPreview(p),
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
 * Rozbija post na tytuł i resztę treści.
 *
 * Zwykle wystarczy pierwsza linia: klub pisze posty z nagłówkiem u góry.
 * Ale na Facebooku równie często leci wszystko jednym ciągiem, bez entera —
 * wtedy cała wiadomość lądowała w nagłówku i wpis był ścianą wersalików.
 * Dlatego długą pierwszą linię tniemy po pierwszym zdaniu.
 *
 * NIC nie ucinamy — funkcja tylko dzieli. Skracanie tytułu to sprawa kafla
 * i jego stylu, nie danych; wpis ma pokazać wszystko, co napisał klub.
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
  const rest = lines.slice(1).join('\n');

  if (first.length <= TITLE_LIMIT) return { title: first, rest };

  // Długa pierwsza linia: tytułem zostaje pierwsze zdanie, reszta schodzi do treści.
  // Kropka musi być na granicy zdania — po niej odstęp i wielka litera — żeby nie
  // rozcinać godziny („10.00”), skrótu czy daty w nawiasie („(26.09)”).
  const boundary = first.search(/(?<=[.!?…])\s+(?=\p{Lu})/u);
  if (boundary > 0) {
    return {
      title: first.slice(0, boundary).trim(),
      rest: [first.slice(boundary).trim(), rest].filter(Boolean).join('\n'),
    };
  }

  // Jedno długie zdanie bez miejsca na cięcie zostaje w całości — lepszy długi
  // tytuł niż urwany w pół myśli. Kafel przytnie go stylem, wpis pokaże cały.
  return { title: first, rest };
}

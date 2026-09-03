import type { MiddlewareHandler } from 'astro';
import { poprawHtml } from './lib/typografia';

/**
 * Nakłada polskie reguły typograficzne na każdą wygenerowaną stronę.
 *
 * Świadomie jako warstwa pośrednia, a nie krok po budowaniu: warstwa pośrednia
 * działa TAKŻE na serwerze deweloperskim, więc podgląd pokazuje dokładnie to,
 * co zobaczy odwiedzający. Wcześniejsza wersja poprawiała tylko gotowy build
 * i localhost kłamał.
 */
export const onRequest: MiddlewareHandler = async (_kontekst, dalej) => {
  const odpowiedz = await dalej();

  const typ = odpowiedz.headers.get('content-type') ?? '';
  if (!typ.includes('text/html')) return odpowiedz;

  const html = await odpowiedz.text();
  return new Response(poprawHtml(html), {
    status: odpowiedz.status,
    statusText: odpowiedz.statusText,
    headers: odpowiedz.headers,
  });
};

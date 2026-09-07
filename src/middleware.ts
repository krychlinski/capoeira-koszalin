import type { MiddlewareHandler } from 'astro';
import { applyTypography } from './lib/typography';

/**
 * Nakłada polskie reguły typograficzne na każdą wygenerowaną stronę.
 *
 * Świadomie jako warstwa pośrednia, a nie krok po budowaniu: warstwa pośrednia
 * działa TAKŻE na serwerze deweloperskim, więc podgląd pokazuje dokładnie to,
 * co zobaczy odwiedzający. Wcześniejsza wersja poprawiała tylko gotowy build
 * i localhost kłamał.
 */
export const onRequest: MiddlewareHandler = async (_context, next) => {
  const response = await next();

  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('text/html')) return response;

  const html = await response.text();
  return new Response(applyTypography(html), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

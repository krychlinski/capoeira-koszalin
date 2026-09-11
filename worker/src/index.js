/**
 * Powiadomienia push dla aktualności.
 *
 * Strona jest statyczna, więc w chwili pojawienia się wpisu nic naszego nie działa.
 * Ten Worker jest jedynym kawałkiem, który wtedy żyje: trzyma subskrypcje i rozsyła
 * powiadomienia. Bez niego web push jest niewykonalny — to ograniczenie protokołu,
 * nie brak pomysłu.
 *
 * Trasy:
 *   POST /subscribe    — zapisuje subskrypcję przeglądarki
 *   POST /unsubscribe  — kasuje ją
 *   POST /notify       — rozsyła, wołane przez GitHub Actions po zbudowaniu strony
 *   GET  /health       — czy żyje i ile jest subskrypcji
 *
 * WYSYŁAMY POWIADOMIENIA BEZ TREŚCI. Prawdziwy ładunek trzeba szyfrować według
 * RFC 8291 (aes128gcm, wymiana kluczy z przeglądarką) i to najbardziej zawiła część
 * całego protokołu. Puste powiadomienie tego nie wymaga: service worker po odebraniu
 * sam dociąga /aktualnosci/latest.json z naszej strony i z niego buduje treść.
 * Zostaje samo podpisywanie VAPID, które Web Crypto robi natywnie.
 */

const TTL = 60 * 60 * 24; // doba — po tylu godzinach powiadomienie przestaje być świeże

const enc = new TextEncoder();

const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

/** Klucz w KV — z adresu endpointu, bo to on identyfikuje subskrypcję. */
async function keyFor(endpoint) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(endpoint));
  return 'sub:' + b64url(digest);
}

/**
 * Nagłówek Authorization według VAPID: podpisany token mówiący serwerowi push,
 * że powiadomienie pochodzi od właściciela klucza publicznego, którym zapisała się
 * przeglądarka. Token jest ważny 12 godzin i dotyczy JEDNEGO serwera push, stąd
 * podpisujemy osobno dla każdego adresu (a nie raz dla wszystkich).
 */
async function vapidHeader(endpoint, env) {
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const token =
    b64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))) +
    '.' +
    b64url(
      enc.encode(
        JSON.stringify({
          aud: new URL(endpoint).origin,
          exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
          sub: env.VAPID_SUBJECT,
        })
      )
    );

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: jwk.d, x: jwk.x, y: jwk.y, ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(token)
  );

  return `vapid t=${token}.${b64url(signature)}, k=${env.VAPID_PUBLIC}`;
}

async function subscribe(request, env) {
  const sub = await request.json().catch(() => null);
  if (!sub?.endpoint || typeof sub.endpoint !== 'string') {
    return json({ error: 'brak adresu subskrypcji' }, 400, corsHeaders(request, env));
  }
  // Przyjmujemy wyłącznie znane serwery push. Bez tego endpoint jest dowolnym
  // adresem, a Worker — otwartą bramką do wysyłania żądań w cudzym imieniu.
  const host = new URL(sub.endpoint).hostname;
  const known = ['.googleapis.com', '.mozilla.com', '.push.apple.com', '.windows.com'];
  if (!known.some((suffix) => host.endsWith(suffix))) {
    return json({ error: 'nieznany serwer push' }, 400, corsHeaders(request, env));
  }

  await env.SUBS.put(
    await keyFor(sub.endpoint),
    JSON.stringify({ endpoint: sub.endpoint, created: new Date().toISOString() })
  );
  return json({ ok: true }, 201, corsHeaders(request, env));
}

async function unsubscribe(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.endpoint) {
    return json({ error: 'brak adresu subskrypcji' }, 400, corsHeaders(request, env));
  }
  await env.SUBS.delete(await keyFor(body.endpoint));
  return json({ ok: true }, 200, corsHeaders(request, env));
}

async function notify(request, env) {
  if (request.headers.get('X-Notify-Secret') !== env.NOTIFY_SECRET) {
    return json({ error: 'brak uprawnień' }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.date) return json({ error: 'brak identyfikatora albo daty' }, 400);

  const when = Date.parse(body.date);
  if (Number.isNaN(when)) return json({ error: 'nieczytelna data wpisu' }, 400);

  // Porównujemy DATĘ, nie identyfikator. Powody są dwa:
  //
  // 1. Budowanie chodzi co godzinę, a wpis zostaje na stronie tygodniami — bez
  //    znacznika ten sam post szedłby w świat przy każdym budowaniu.
  // 2. Gdy ktoś SKASUJE post na Facebooku, najnowszym staje się z powrotem
  //    poprzedni. Jego identyfikator różni się od zapamiętanego, więc porównanie
  //    po identyfikatorze uznałoby to za nowość i rozesłało powiadomienie
  //    o starym wpisie. Data nie da się na to nabrać: cofnięcie się w czasie
  //    nigdy nie jest nowym wpisem.
  //
  // Edycja starego wpisu też nie powiadamia — treść się zmienia, data nie.
  const raw = await env.SUBS.get('state:last-post');
  let last = null;
  try {
    last = raw ? JSON.parse(raw) : null;
  } catch {
    // Zapis w starym formacie (sam identyfikator). Traktujemy jak brak stanu.
    last = null;
  }

  const before = last?.date ? Date.parse(last.date) : NaN;
  if (!Number.isNaN(before) && when <= before) {
    return json(
      {
        ok: true,
        skipped: when === before ? 'ten wpis już rozesłany' : 'wpis starszy niż ostatnio rozesłany',
        ostatni: last,
      },
      200
    );
  }

  const sent = [];
  let cursor;
  do {
    const page = await env.SUBS.list({ prefix: 'sub:', cursor });
    for (const entry of page.keys) {
      const raw = await env.SUBS.get(entry.name);
      if (!raw) continue;
      const { endpoint } = JSON.parse(raw);
      sent.push(
        fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: await vapidHeader(endpoint, env),
            TTL: String(TTL),
            // Wysoki, nie normalny. Zaobserwowane 2026-09-11: przy 'normal' Google
            // przyjął wiadomość od razu, a telefon z Androidem pokazał ją dopiero
            // po długim czasie — Android w uśpieniu odkłada zwykłe wiadomości do
            // okna, w którym sam się wybudzi. Apple dostarczało od razu mimo to.
            // Wysoki priorytet budzi telefon i daje mu na chwilę sieć, więc service
            // worker zdąży też dociągnąć latest.json. Google karze nadużywanie go
            // tylko wtedy, gdy wiadomość nie kończy się powiadomieniem, a u nas
            // kończy się zawsze.
            Urgency: 'high',
            // Powiadomienie bez treści — żadnego Content-Encoding ani ciała.
            'Content-Length': '0',
          },
        }).then(async (res) => {
          // 404 i 410 znaczą, że subskrypcja wygasła albo ktoś odinstalował
          // przeglądarkę. Trzymanie jej w nieskończoność powoli zapycha KV.
          if (res.status === 404 || res.status === 410) {
            await env.SUBS.delete(entry.name);
            return 'wygasła';
          }
          return res.ok ? 'ok' : `błąd ${res.status}`;
        }).catch(() => 'wyjątek')
      );
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);

  const results = await Promise.all(sent);
  await env.SUBS.put('state:last-post', JSON.stringify({ id: body.id, date: body.date }));

  const summary = results.reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {});
  return json({ ok: true, wyslano: results.length, wynik: summary }, 200);
}

async function health(request, env) {
  let count = 0;
  let cursor;
  do {
    const page = await env.SUBS.list({ prefix: 'sub:', cursor });
    count += page.keys.length;
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  const raw = await env.SUBS.get('state:last-post');
  let ostatniWpis = null;
  try {
    ostatniWpis = raw ? JSON.parse(raw) : null;
  } catch {
    ostatniWpis = raw;
  }
  return json({ ok: true, subskrypcje: count, ostatniWpis }, 200, corsHeaders(request, env));
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (request.method === 'POST' && pathname === '/subscribe') return subscribe(request, env);
    if (request.method === 'POST' && pathname === '/unsubscribe') return unsubscribe(request, env);
    if (request.method === 'POST' && pathname === '/notify') return notify(request, env);
    if (request.method === 'GET' && pathname === '/health') return health(request, env);

    return json({ error: 'nie ma takiej trasy' }, 404, corsHeaders(request, env));
  },
};

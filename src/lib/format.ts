const MONTHS = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

export function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function formatDateRange(from: Date, to?: Date): string {
  if (!to || from.getTime() === to.getTime()) return formatDate(from);
  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `${from.getDate()}–${to.getDate()} ${MONTHS[from.getMonth()]} ${from.getFullYear()}`;
  }
  return `${formatDate(from)} – ${formatDate(to)}`;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Odmiana rzeczownika przez liczbę wedle polskich reguł.
 *
 * Polski ma trzy formy i podział nie jest oczywisty: 2-4 to jedna, ale 12-14
 * już inna, za to 22-24 znowu ta pierwsza. Zamiast rozpisywać te warunki
 * korzystamy z Intl.PluralRules, które ma reguły wbudowane w przeglądarkę.
 */
const PLURAL_RULES = new Intl.PluralRules('pl-PL');

export function plural(n: number, one: string, few: string, many: string): string {
  const form = PLURAL_RULES.select(n);
  return form === 'one' ? one : form === 'few' ? few : many;
}

/** „1 zdjęcie", „4 zdjęcia", „7 zdjęć" */
export function photoCount(n: number): string {
  return `${n} ${plural(n, 'zdjęcie', 'zdjęcia', 'zdjęć')}`;
}

const MIESIACE = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

export function dataPl(d: Date): string {
  return `${d.getDate()} ${MIESIACE[d.getMonth()]} ${d.getFullYear()}`;
}

export function dataKrotka(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function zakresDat(od: Date, do_?: Date): string {
  if (!do_ || od.getTime() === do_.getTime()) return dataPl(od);
  if (od.getMonth() === do_.getMonth() && od.getFullYear() === do_.getFullYear()) {
    return `${od.getDate()}–${do_.getDate()} ${MIESIACE[od.getMonth()]} ${od.getFullYear()}`;
  }
  return `${dataPl(od)} – ${dataPl(do_)}`;
}

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Odmiana rzeczownika przez liczbę wedle polskich reguł.
 *
 * Polski ma trzy formy i podział nie jest oczywisty: 2-4 to jedna, ale 12-14
 * już inna, za to 22-24 znowu ta pierwsza. Zamiast rozpisywać te warunki
 * korzystamy z Intl.PluralRules, które ma reguły wbudowane w przeglądarkę.
 */
const REGULY = new Intl.PluralRules('pl-PL');

export function odmien(n: number, jeden: string, kilka: string, wiele: string): string {
  const forma = REGULY.select(n);
  return forma === 'one' ? jeden : forma === 'few' ? kilka : wiele;
}

/** „1 zdjęcie", „4 zdjęcia", „7 zdjęć" */
export function ileZdjec(n: number): string {
  return `${n} ${odmien(n, 'zdjęcie', 'zdjęcia', 'zdjęć')}`;
}

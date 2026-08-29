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

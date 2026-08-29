import type { ImageMetadata } from 'astro';

// CMS zapisuje ścieżki jako /media/plik.jpg, a pliki leżą w src/assets/media,
// żeby Astro mogło je zoptymalizować. Dopasowujemy po samej nazwie pliku.
const pliki = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/media/**/*.{jpeg,jpg,JPG,JPEG,png,PNG,webp,avif,gif}',
  { eager: true }
);

export function obraz(sciezka?: string): ImageMetadata | undefined {
  if (!sciezka) return undefined;
  const nazwa = sciezka.split('/').pop();
  if (!nazwa) return undefined;
  const wpis = Object.entries(pliki).find(([klucz]) => klucz.endsWith('/' + nazwa));
  return wpis?.[1].default;
}

import type { ImageMetadata } from 'astro';

// CMS zapisuje ścieżki jako /media/plik.jpg, a pliki leżą w src/assets/media,
// żeby Astro mogło je zoptymalizować. Dopasowujemy po samej nazwie pliku.
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/media/**/*.{jpeg,jpg,JPG,JPEG,png,PNG,webp,avif,gif}',
  { eager: true }
);

export function resolveImage(path?: string): ImageMetadata | undefined {
  if (!path) return undefined;
  const name = path.split('/').pop();
  if (!name) return undefined;
  const found = Object.entries(files).find(([key]) => key.endsWith('/' + name));
  return found?.[1].default;
}

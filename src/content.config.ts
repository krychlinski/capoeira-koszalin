import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const aktualnosci = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/aktualnosci' }),
  schema: z.object({
    tytul: z.string(),
    data: z.coerce.date(),
    zajawka: z.string().optional(),
    zdjecie: z.string().optional(),
    opublikowany: z.boolean().default(true),
  }),
});

const wydarzenia = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/wydarzenia' }),
  schema: z.object({
    tytul: z.string(),
    dataOd: z.coerce.date(),
    dataDo: z.coerce.date().optional(),
    miejsce: z.string().optional(),
    zajawka: z.string().optional(),
    zdjecie: z.string().optional(),
  }),
});

const instruktorzy = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/instruktorzy' }),
  schema: z.object({
    imie: z.string(),
    apelido: z.string().optional(),
    stopien: z.string().optional(),
    zdjecie: z.string().optional(),
    kolejnosc: z.number().default(0),
  }),
});

const zajecia = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/zajecia' }),
  schema: z.object({
    grupa: z.string(),
    podtytul: z.string().optional(),
    miejsce: z.string().optional(),
    adres: z.string().optional(),
    terminy: z
      .array(
        z.object({
          dzien: z.string(),
          od: z.string(),
          do: z.string().optional(),
        })
      )
      .default([]),
    kolejnosc: z.number().default(0),
  }),
});

const galeria = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/galeria' }),
  schema: z.object({
    tytul: z.string(),
    data: z.coerce.date(),
    okladka: z.string().optional(),
    zdjecia: z.array(z.string()).default([]),
  }),
});

const strony = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/strony' }),
  schema: z.object({
    tytul: z.string(),
    naglowek: z.string().optional(),
    zdjecie: z.string().optional(),
    // Numerowane punkty — używa ich strona „Pierwszy trening”.
    punktyNadtytul: z.string().optional(),
    punktyTytul: z.string().optional(),
    punkty: z.array(z.object({ tytul: z.string(), opis: z.string() })).optional(),
  }),
});

const cennik = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cennik' }),
  schema: z.object({
    nazwa: z.string(),
    cena: z.string(),
    opis: z.string().optional(),
    kategoria: z.enum(['miesieczne', 'dodatkowe']).default('miesieczne'),
    kolejnosc: z.number().default(0),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    pytanie: z.string(),
    kolejnosc: z.number().default(0),
  }),
});

export const collections = { aktualnosci, wydarzenia, instruktorzy, zajecia, galeria, strony, cennik, faq };

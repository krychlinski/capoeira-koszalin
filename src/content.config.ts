import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    venue: z.string().optional(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
  }),
});

const instructors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/instructors' }),
  schema: z.object({
    name: z.string(),
    // Apelido i corda to terminy capoeiry, nie tłumaczymy ich.
    apelido: z.string().optional(),
    corda: z.string().optional(),
    image: z.string().optional(),
    order: z.number().default(0),
  }),
});

const classes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/classes' }),
  schema: z.object({
    group: z.string(),
    subtitle: z.string().optional(),
    venue: z.string().optional(),
    address: z.string().optional(),
    sessions: z
      .array(
        z.object({
          day: z.string(),
          from: z.string(),
          to: z.string().optional(),
        })
      )
      .default([]),
    order: z.number().default(0),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gallery' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    cover: z.string().optional(),
    images: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    heading: z.string().optional(),
    image: z.string().optional(),
    // Numerowane punkty — używa ich strona „Pierwszy trening”.
    pointsEyebrow: z.string().optional(),
    pointsHeading: z.string().optional(),
    points: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  }),
});

const pricing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pricing' }),
  schema: z.object({
    name: z.string(),
    price: z.string(),
    description: z.string().optional(),
    category: z.enum(['monthly', 'extra']).default('monthly'),
    order: z.number().default(0),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { news, events, instructors, classes, gallery, pages, pricing, faq };

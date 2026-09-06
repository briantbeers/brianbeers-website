import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categoryEnum = z.enum([
  'home-services',
  'senior-care',
  'retail-resale',
  'auto',
  'food-hospitality',
  'business-services',
  'health-wellness',
  'real-estate-ops',
  'education',
  'other',
]);

const statusEnum = z.enum(['draft', 'ready', 'published']);

const buyerTypeEnum = z.enum([
  'corporate-escape-planner',
  'family-flexibility-buyer',
  'operator-without-idea',
  'deal-searcher',
  'existing-owner-scale',
]);

const sourceTypeEnum = z.enum(['youtube', 'newsletter', 'podcast', 'research', 'other']);

const doorEnum = z.enum(['buy', 'grow']);

const models = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx,mdoc}', base: './src/content/models' }),
  schema: z.object({
    title: z.string(),
    // Filename is canonical URL slug; optional frontmatter mirrors SCHEMA for CoS writers / Keystatic.
    slug: z.string().optional(),
    description: z.string(),
    category: categoryEnum,
    status: statusEnum,
    publish: z.boolean(),
    readMinutes: z.number().int().positive(),
    tags: z.array(z.string()).optional(),
    doors: z.array(doorEnum).optional(),
    buyerTypes: z.array(buyerTypeEnum).optional(),
    relatedSlugs: z.array(z.string()).optional(),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().url().optional(),
          type: sourceTypeEnum.optional(),
        })
      )
      .optional(),
    cta: z.string().optional(),
    updated: z.coerce.date().optional(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx,mdoc}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    description: z.string(),
    publish: z.boolean(),
    status: statusEnum,
    readMinutes: z.number().int().positive(),
    kind: z.enum(['article', 'guide']),
    tags: z.array(z.string()).optional(),
    doors: z.array(doorEnum).optional(),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { models, articles };

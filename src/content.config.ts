import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    status: z.enum(['Research', 'Ongoing']),
    thesis: z.string(),
    problem: z.string(),
    coreIdea: z.string(),
    method: z.string(),
    results: z.string(),
    warning: z.string().optional(),
    keyPoints: z.array(z.string()).min(1),
    headlineMetrics: z.array(z.string()).default([]),
    assets: z.array(z.string()).default([]),
    externalLinks: z
      .array(
        z.object({
          label: z.string(),
          href: z.string()
        })
      )
      .default([]),
    order: z.number().int().nonnegative().default(999)
  })
});

const summaries = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/summaries' }),
  schema: z.object({
    title: z.string(),
    projectSlug: z.string(),
    standfirst: z.string(),
    updated: z.string(),
    readingMins: z.number().int().positive(),
    pdfPath: z.string().optional(),
    keyTakeaways: z.array(z.string()).min(1),
    order: z.number().int().nonnegative().default(999)
  })
});

export const collections = {
  projects,
  summaries
};

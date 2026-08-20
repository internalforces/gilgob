import { z } from 'astro/zod';

export const commonSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  created: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  aliases: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false),
  slug: z.string().min(1).optional(),
  nextQuestions: z.array(z.string().min(1)).optional(),
});

export const knowledgeSchema = commonSchema.extend({
  status: z.enum(['seed', 'growing', 'mastered']),
});

export const explorationSchema = commonSchema.extend({
  status: z.enum(['active', 'paused', 'complete']),
});

export const projectSchema = commonSchema.extend({
  status: z.enum(['idea', 'building', 'maintained', 'archived']),
  repository: z.url().optional(),
});

export const logSchema = commonSchema;

export type ContentFrontmatter = z.infer<typeof commonSchema> & { status?: string };

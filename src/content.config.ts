import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { explorationSchema, knowledgeSchema, logSchema, projectSchema } from './lib/content/schema';

export const collections = {
  knowledge: defineCollection({
    loader: glob({ pattern: '**/*.(md|mdx)', base: './content/knowledge', retainBody: true }),
    schema: knowledgeSchema,
  }),
  explorations: defineCollection({
    loader: glob({ pattern: '**/*.(md|mdx)', base: './content/explorations', retainBody: true }),
    schema: explorationSchema,
  }),
  projects: defineCollection({
    loader: glob({ pattern: '**/*.(md|mdx)', base: './content/projects', retainBody: true }),
    schema: projectSchema,
  }),
  logs: defineCollection({
    loader: glob({ pattern: '**/*.(md|mdx)', base: './content/logs', retainBody: true }),
    schema: logSchema,
  }),
};

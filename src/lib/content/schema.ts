import { z } from 'astro/zod';

const safeSlugSchema = z.string().min(1).refine((slug) => {
  if (
    slug.startsWith('/')
    || slug.includes('\\')
    || slug.includes('?')
    || slug.includes('#')
    || slug.includes('%')
  ) return false;
  const segments = slug.split('/');
  return segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}, 'slug는 안전한 POSIX 상대 경로여야 합니다.');

const httpsUrlSchema = z.url().refine((value) => new URL(value).protocol === 'https:', {
  message: 'HTTPS URL만 사용할 수 있습니다.',
});

const shareIdSchema = z.string().min(12).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'shareId는 소문자 영숫자와 하이픈으로 구성된 안전한 단일 경로여야 합니다.',
);

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
  slug: safeSlugSchema.optional(),
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
  repository: httpsUrlSchema.optional(),
});

export const logSchema = commonSchema;

export const portfolioSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  shareId: shareIdSchema,
  project: safeSlugSchema,
  targetRole: z.string().min(1),
  period: z.string().min(1),
  projectType: z.string().min(1),
  role: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).min(1),
  updated: z.coerce.date(),
  draft: z.boolean().default(true),
  repository: httpsUrlSchema.optional(),
  package: httpsUrlSchema.optional(),
  demo: httpsUrlSchema.optional(),
});

export type ContentFrontmatter = z.infer<typeof commonSchema> & { status?: string };

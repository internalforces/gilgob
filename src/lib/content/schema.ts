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

const portfolioMetricSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1),
});

const portfolioCapabilitySchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  evidence: z.string().min(1),
  visual: z.enum(['trend', 'threshold', 'window']).optional(),
});

const portfolioArchitectureNodeSchema = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().min(1),
});

const portfolioDecisionSchema = z.object({
  title: z.string().min(1),
  implementation: z.string().min(1),
  impact: z.string().min(1),
});

const portfolioProofSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

export const portfolioSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  shareId: shareIdSchema,
  project: safeSlugSchema,
  targetRole: z.string().min(1),
  targetDomains: z.object({
    primary: z.string().min(1),
    subdomains: z.array(z.string().min(1)).min(1),
  }),
  period: z.string().min(1),
  projectType: z.string().min(1),
  role: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).min(1),
  updated: z.coerce.date(),
  draft: z.boolean().default(true),
  repository: httpsUrlSchema.optional(),
  package: httpsUrlSchema.optional(),
  demo: httpsUrlSchema.optional(),
  headline: z.string().min(1),
  metrics: z.array(portfolioMetricSchema).length(4),
  story: z.object({
    problem: z.string().min(1),
    approach: z.string().min(1),
    result: z.string().min(1),
  }),
  capabilities: z.array(portfolioCapabilitySchema).length(3),
  ownership: z.array(z.string().min(1)).min(1),
  architecture: z.array(portfolioArchitectureNodeSchema).min(2).max(4),
  decisions: z.array(portfolioDecisionSchema).length(3),
  validation: z.object({
    steps: z.array(z.string().min(1)).min(3).max(6),
    proofs: z.array(portfolioProofSchema).length(4),
    command: z.string().min(1).optional(),
  }),
  currentScope: z.string().min(1),
  nextStep: z.string().min(1),
});

export type ContentFrontmatter = z.infer<typeof commonSchema> & { status?: string };

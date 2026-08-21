import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import {
  explorationSchema,
  knowledgeSchema,
  logSchema,
  portfolioSchema,
  projectSchema,
} from '../../src/lib/content/schema';

const common = {
  title: 'B-Tree는 왜 DB Index에 사용될까?',
  description: 'B-Tree 인덱스를 설명한다.',
  category: 'Database',
  tags: ['B-Tree', 'Index'],
  created: '2026-08-20',
  draft: false,
  aliases: ['B-Tree Index'],
};

const portfolio = {
  title: 'Signal Hub 포트폴리오',
  description: '결정론적 시계열 분석 엔진을 설계하고 배포한 과정이다.',
  shareId: '8c5e1a7d3b92-signal-hub',
  project: 'signal-hub',
  targetRole: '백엔드 개발자',
  targetDomains: {
    primary: '데이터 플랫폼',
    subdomains: ['시계열 분석', '핀테크 데이터', '개발자 도구'],
  },
  period: '2026.08–현재',
  projectType: '개인 프로젝트',
  role: ['아키텍처 설계', 'CLI와 분석 엔진 구현', 'npm 배포'],
  tags: ['TypeScript', 'SQLite', 'CLI'],
  updated: '2026-08-21',
  draft: false,
  repository: 'https://github.com/internalforces/SignalHub',
  package: 'https://www.npmjs.com/package/csv-to-signal',
};

describe('content schemas', () => {
  it('coerces dates and accepts knowledge status', () => {
    const value = knowledgeSchema.parse({ ...common, status: 'mastered' });
    expect(value.created).toBeInstanceOf(Date);
  });

  it('rejects a project-only status in knowledge', () => {
    expect(() => knowledgeSchema.parse({ ...common, status: 'building' })).toThrow();
  });

  it('accepts the project lifecycle', () => {
    expect(projectSchema.parse({ ...common, status: 'maintained' }).status).toBe('maintained');
  });

  it.each([
    '../escape',
    'nested/../escape',
    './dot',
    'nested//empty',
    '/absolute',
    'windows\\path',
    'query?draft=true',
    'fragment#heading',
    '%2e%2e/%2e%2e/graph',
    '%2E%2e/escape',
    'nested%2fescape',
    'nested%5Cescape',
    'control%00byte',
    'malformed%',
  ])('rejects unsafe explicit slug %s', (slug) => {
    expect(() => knowledgeSchema.parse({ ...common, status: 'growing', slug })).toThrow();
  });

  it('accepts safe Unicode POSIX slug segments', () => {
    expect(knowledgeSchema.parse({
      ...common,
      status: 'growing',
      slug: '보안/위협-모델',
    }).slug).toBe('보안/위협-모델');
  });

  it('accepts only HTTPS project repository URLs', () => {
    expect(projectSchema.parse({
      ...common,
      status: 'maintained',
      repository: 'https://github.com/internalforces/gilgob',
    }).repository).toBe('https://github.com/internalforces/gilgob');

    expect(() => projectSchema.parse({
      ...common,
      status: 'maintained',
      repository: 'http://github.com/internalforces/gilgob',
    })).toThrow();
  });

  it('accepts optional next exploration questions', () => {
    const value = knowledgeSchema.parse({
      ...common,
      status: 'growing',
      nextQuestions: ['분기 계수는 읽기 비용에 어떤 영향을 줄까?'],
    });

    expect(value.nextQuestions).toEqual(['분기 계수는 읽기 비용에 어떤 영향을 줄까?']);
  });

  it('accepts an unlisted portfolio case study', () => {
    expect(portfolioSchema.parse(portfolio).shareId).toBe(portfolio.shareId);
  });

  it('requires prioritized portfolio target domains', () => {
    expect(portfolioSchema.parse(portfolio).targetDomains).toEqual({
      primary: '데이터 플랫폼',
      subdomains: ['시계열 분석', '핀테크 데이터', '개발자 도구'],
    });

    const { targetDomains: _targetDomains, ...portfolioWithoutTargetDomains } = portfolio;
    expect(() => portfolioSchema.parse(portfolioWithoutTargetDomains)).toThrow();
    expect(() => portfolioSchema.parse({
      ...portfolio,
      targetDomains: { primary: '데이터 플랫폼', subdomains: [] },
    })).toThrow();
  });

  it.each(['../secret', 'nested/share', 'encoded%2fpath', 'query?x=1', 'fragment#x'])
    ('rejects unsafe portfolio share id %s', (shareId) => {
      expect(() => portfolioSchema.parse({ ...portfolio, shareId })).toThrow();
    });

  it('requires at least one portfolio role', () => {
    const { role: _role, ...portfolioWithoutRole } = portfolio;
    expect(() => portfolioSchema.parse(portfolioWithoutRole)).toThrow();
  });

  it('accepts only HTTPS portfolio links', () => {
    expect(() => portfolioSchema.parse({
      ...portfolio,
      repository: 'http://github.com/internalforces/SignalHub',
    })).toThrow();
  });

  it('validates the frontmatter in every Obsidian template', () => {
    const templates = [
      ['knowledge', knowledgeSchema],
      ['exploration', explorationSchema],
      ['project', projectSchema],
      ['log', logSchema],
      ['portfolio', portfolioSchema],
    ] as const;

    for (const [name, schema] of templates) {
      const path = fileURLToPath(new URL(`../../content/templates/${name}.md`, import.meta.url));
      expect(() => schema.parse(matter(readFileSync(path, 'utf8')).data)).not.toThrow();
    }
  });
});

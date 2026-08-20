import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import {
  explorationSchema,
  knowledgeSchema,
  logSchema,
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
  ])('rejects unsafe explicit slug %s', (slug) => {
    expect(() => knowledgeSchema.parse({ ...common, status: 'growing', slug })).toThrow();
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

  it('validates the frontmatter in every Obsidian template', () => {
    const templates = [
      ['knowledge', knowledgeSchema],
      ['exploration', explorationSchema],
      ['project', projectSchema],
      ['log', logSchema],
    ] as const;

    for (const [name, schema] of templates) {
      const path = fileURLToPath(new URL(`../../content/templates/${name}.md`, import.meta.url));
      expect(() => schema.parse(matter(readFileSync(path, 'utf8')).data)).not.toThrow();
    }
  });
});

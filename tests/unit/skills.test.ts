import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import {
  calculateFieldProgress,
  calculateSkillProgress,
  loadSkills,
  validateSkillLinks,
} from '../../src/lib/skills/load-skills';
import { skillTreeDocumentSchema } from '../../src/lib/skills/schema';
import type { ContentIndex, ContentRecord } from '../../src/lib/content/types';

function document(overrides: Partial<ContentRecord> = {}): ContentRecord {
  return {
    id: 'knowledge/database/b-tree-index',
    kind: 'knowledge',
    slug: 'database/b-tree-index',
    url: '/knowledge/database/b-tree-index',
    title: 'B-Tree는 왜 DB Index에 사용될까?',
    description: 'B-Tree 인덱스를 설명합니다.',
    category: 'Computer Science',
    tags: ['B-Tree'],
    aliases: [],
    status: 'mastered',
    created: '2026-08-20',
    updated: '2026-08-20',
    draft: false,
    featured: false,
    sourcePath: 'knowledge/database/b-tree-index.md',
    outgoing: [],
    backlinks: [],
    related: [],
    ...overrides,
  };
}

function index(documents: ContentRecord[]): ContentIndex {
  return {
    documents,
    graph: { nodes: [], edges: [] },
    generatedAt: '2026-08-20T00:00:00.000Z',
  };
}

it('calculates progress from explicit status, not article count', () => {
  const result = calculateSkillProgress([
    { id: 'dfs', status: 'mastered' },
    { id: 'dp', status: 'learning' },
    { id: 'graph', status: 'planned' },
  ]);

  expect(result).toEqual({ mastered: 1, learning: 1, planned: 1, percent: 50 });
});

it('returns zero progress for an empty skill collection', () => {
  expect(calculateSkillProgress([])).toEqual({
    mastered: 0,
    learning: 0,
    planned: 0,
    percent: 0,
  });
});

it('parses recursively nested fields with strict leaf contracts', () => {
  const result = skillTreeDocumentSchema.parse({
    fields: [{
      id: 'computer-science',
      label: '컴퓨터 과학',
      children: [{
        id: 'algorithms',
        label: '알고리즘',
        children: [{
          id: 'graph-search',
          label: '그래프 탐색',
          status: 'learning',
          related: ['knowledge/database/b-tree-index'],
        }],
      }],
    }],
  });

  expect(result.fields[0].children[0]).toMatchObject({ id: 'algorithms' });
  expect(() => skillTreeDocumentSchema.parse({
    fields: [{
      id: 'computer-science',
      label: '컴퓨터 과학',
      children: [{
        id: 'graph-search',
        label: '그래프 탐색',
        status: 'learning',
        related: [],
        articleCount: 4,
      }],
    }],
  })).toThrow();
});

it('aggregates progress for a field across nested child fields', () => {
  const tree = skillTreeDocumentSchema.parse({
    fields: [{
      id: 'computer-science',
      label: '컴퓨터 과학',
      children: [
        {
          id: 'database',
          label: '데이터베이스',
          status: 'mastered',
          related: ['knowledge/database/b-tree-index'],
        },
        {
          id: 'algorithms',
          label: '알고리즘',
          children: [{
            id: 'graph-search',
            label: '그래프 탐색',
            status: 'planned',
            related: [],
          }],
        },
      ],
    }],
  });

  expect(calculateFieldProgress(tree.fields[0])).toEqual({
    mastered: 1,
    learning: 0,
    planned: 1,
    percent: 50,
  });
});

it('rejects a missing related document with the exact field and skill IDs', () => {
  expect(() => validateSkillLinks(
    [{ id: 'dfs', related: ['knowledge/missing'] }],
    [],
    'algorithms',
  )).toThrow(/분야 "algorithms".*스킬 "dfs".*존재하지 않는 관련 문서 "knowledge\/missing"/);
});

it('rejects related documents that are draft or are not Knowledge entries', () => {
  const nodes = [{ id: 'dfs', related: ['knowledge/draft', 'logs/today'] }];
  const documents = [
    document({ id: 'knowledge/draft', slug: 'draft', draft: true }),
    document({ id: 'logs/today', kind: 'logs', slug: 'today', url: '/logs/today', draft: false }),
  ];

  expect(() => validateSkillLinks(nodes, documents, 'algorithms'))
    .toThrow(/분야 "algorithms".*스킬 "dfs".*공개 Knowledge 문서가 아닌 관련 문서 "knowledge\/draft"/);
});

it('loads YAML, validates links against the content index, and aggregates progress', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skill-tree-'));
  const path = join(directory, 'skills.yaml');
  await writeFile(path, [
    'fields:',
    '  - id: computer-science',
    '    label: 컴퓨터 과학',
    '    children:',
    '      - id: database',
    '        label: 데이터베이스',
    '        children:',
    '          - id: b-tree-index',
    '            label: B-Tree 인덱스',
    '            status: mastered',
    '            related: [knowledge/database/b-tree-index]',
    '          - id: query-optimization',
    '            label: 쿼리 최적화',
    '            status: learning',
    '            related: []',
  ].join('\n'), 'utf8');

  await expect(loadSkills(path, index([document()]))).resolves.toMatchObject({
    fields: [{ id: 'computer-science' }],
    progress: { mastered: 1, learning: 1, planned: 0, percent: 75 },
  });
});

it('reports nested field and skill IDs when loadSkills finds a bad link', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skill-tree-'));
  const path = join(directory, 'skills.yaml');
  await writeFile(path, [
    'fields:',
    '  - id: computer-science',
    '    label: 컴퓨터 과학',
    '    children:',
    '      - id: algorithms',
    '        label: 알고리즘',
    '        children:',
    '          - id: dfs',
    '            label: 깊이 우선 탐색',
    '            status: learning',
    '            related: [knowledge/missing]',
  ].join('\n'), 'utf8');

  await expect(loadSkills(path, index([]))).rejects.toThrow(
    /분야 "algorithms".*스킬 "dfs".*knowledge\/missing/,
  );
});

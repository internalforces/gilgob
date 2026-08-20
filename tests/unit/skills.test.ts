import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import {
  calculateFieldProgress,
  calculateSkillProgress,
  loadSkills,
  loadSkillsFromCandidates,
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

it.each([
  {
    name: 'duplicate fields',
    tree: {
      fields: [
        { id: 'shared', label: '첫 분야', children: [{ id: 'one', label: '하나', status: 'planned', related: [] }] },
        { id: 'shared', label: '둘째 분야', children: [{ id: 'two', label: '둘', status: 'planned', related: [] }] },
      ],
    },
    firstPath: 'fields.0',
    secondPath: 'fields.1',
  },
  {
    name: 'duplicate leaves',
    tree: {
      fields: [{
        id: 'root',
        label: '분야',
        children: [
          { id: 'shared', label: '첫 기술', status: 'learning', related: [] },
          { id: 'shared', label: '둘째 기술', status: 'planned', related: [] },
        ],
      }],
    },
    firstPath: 'fields.0.children.0',
    secondPath: 'fields.0.children.1',
  },
  {
    name: 'field and leaf collisions',
    tree: {
      fields: [{
        id: 'root',
        label: '분야',
        children: [
          {
            id: 'shared',
            label: '하위 분야',
            children: [{ id: 'nested', label: '중첩 기술', status: 'learning', related: [] }],
          },
          { id: 'shared', label: '기술', status: 'planned', related: [] },
        ],
      }],
    },
    firstPath: 'fields.0.children.0',
    secondPath: 'fields.0.children.1',
  },
])('rejects $name with the collision ID and both paths', ({ tree, firstPath, secondPath }) => {
  const result = skillTreeDocumentSchema.safeParse(tree);

  expect(result.success).toBe(false);
  if (result.success) return;
  const message = result.error.issues.map((issue) => issue.message).join('\n');
  expect(message).toContain('shared');
  expect(message).toContain(firstPath);
  expect(message).toContain(secondPath);
});

it('rejects IDs that cannot be used as stable DOM identifiers', () => {
  expect(() => skillTreeDocumentSchema.parse({
    fields: [{
      id: 'computer science',
      label: '컴퓨터 과학',
      children: [{ id: 'graph-search', label: '그래프 탐색', status: 'planned', related: [] }],
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
  const nodes = [{ id: 'dfs', related: ['draft-alias'] }];
  const documents = [document({
    id: 'knowledge/draft',
    slug: 'draft',
    aliases: ['draft-alias'],
    draft: true,
  })];

  expect(() => validateSkillLinks(nodes, documents, 'algorithms'))
    .toThrow(/분야 "algorithms".*스킬 "dfs".*공개 Knowledge 문서가 아닌 관련 문서 "draft-alias"/);
});

it('rejects a non-Knowledge related document resolved by slug', () => {
  const nodes = [{ id: 'dfs', related: ['today'] }];
  const documents = [document({
    id: 'logs/today',
    kind: 'logs',
    slug: 'today',
    url: '/logs/today',
  })];

  expect(() => validateSkillLinks(nodes, documents, 'algorithms'))
    .toThrow(/분야 "algorithms".*스킬 "dfs".*공개 Knowledge 문서가 아닌 관련 문서 "today"/);
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

it('normalizes exact ID, slug, and alias references to one canonical Knowledge ID', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skill-tree-'));
  const path = join(directory, 'skills.yaml');
  await writeFile(path, [
    'fields:',
    '  - id: computer-science',
    '    label: 컴퓨터 과학',
    '    children:',
    '      - id: b-tree-index',
    '        label: B-Tree 인덱스',
    '        status: mastered',
    '        related:',
    '          - knowledge/database/b-tree-index',
    '          - database/b-tree-index',
    '          - B-Tree Index',
  ].join('\n'), 'utf8');

  const result = await loadSkills(path, index([document({ aliases: ['B-Tree Index'] })]));
  const skill = result.fields[0].children[0];

  expect('children' in skill ? [] : skill.related).toEqual(['knowledge/database/b-tree-index']);
});

it('prefers canonical data/skills.yaml when canonical and legacy candidates both exist', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skill-candidates-'));
  const canonicalPath = join(directory, 'data', 'skills.yaml');
  const legacyPath = join(directory, 'skills.yaml');
  await mkdir(join(directory, 'data'));
  await Promise.all([
    writeFile(canonicalPath, [
      'fields:',
      '  - id: canonical',
      '    label: 정식 스킬',
      '    children:',
      '      - id: canonical-skill',
      '        label: 정식 기술',
      '        status: mastered',
      '        related: []',
    ].join('\n'), 'utf8'),
    writeFile(legacyPath, [
      'fields:',
      '  - id: legacy',
      '    label: 이전 스킬',
      '    children:',
      '      - id: legacy-skill',
      '        label: 이전 기술',
      '        status: planned',
      '        related: []',
    ].join('\n'), 'utf8'),
  ]);

  const selection = await loadSkillsFromCandidates(index([]), [legacyPath, canonicalPath]);

  expect(selection.data?.fields[0].id).toBe('canonical');
  expect(selection.path).toBe(canonicalPath);
  expect(selection.data?.progress.percent).toBe(100);
});

it('continues from an invalid canonical candidate to a valid legacy candidate', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skill-candidates-'));
  const canonicalPath = join(directory, 'data', 'skills.yaml');
  const legacyPath = join(directory, 'skills.yaml');
  await mkdir(join(directory, 'data'));
  await Promise.all([
    writeFile(canonicalPath, 'fields: invalid\n', 'utf8'),
    writeFile(legacyPath, [
      'fields:',
      '  - id: legacy',
      '    label: 이전 스킬',
      '    children:',
      '      - id: legacy-skill',
      '        label: 이전 기술',
      '        status: learning',
      '        related: []',
    ].join('\n'), 'utf8'),
  ]);

  const selection = await loadSkillsFromCandidates(index([]), [canonicalPath, legacyPath]);

  expect(selection.data?.fields[0].id).toBe('legacy');
  expect(selection.errors).toHaveLength(1);
});

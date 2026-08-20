import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import {
  calculateContentStats,
  loadSkillSignal,
} from '../../src/lib/content/stats';
import type { ContentStatsEntry } from '../../src/lib/content/stats';
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
    aliases: ['B-Tree Index'],
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

function index(documents: ContentRecord[] = [document()]): ContentIndex {
  return { documents, graph: { nodes: [], edges: [] }, generatedAt: '2026-08-20T00:00:00.000Z' };
}

it('counts documents, connections, categories, and active explorations', () => {
  const stats = calculateContentStats([
    { kind: 'knowledge', category: 'Database', outgoing: ['knowledge/b'] },
    { kind: 'explorations', category: 'AI', status: 'active', outgoing: [] },
  ]);

  expect(stats).toMatchObject({
    documents: 2,
    connections: 1,
    categories: 2,
    activeExplorations: 1,
  });
});

it('uses explicit YAML statuses when a future skills file is present', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skills-'));
  const path = join(directory, 'skills.yaml');
  await writeFile(path, [
    'fields:',
    '  - id: database',
    '    label: 데이터베이스',
    '    children:',
    '      - id: b-tree',
    '        label: B-Tree',
    '        status: mastered',
    '        related: [knowledge/database/b-tree-index]',
    '      - id: indexing',
    '        label: 인덱싱',
    '        status: learning',
    '        related: []',
    '      - id: query-plan',
    '        label: 실행 계획',
    '        status: planned',
    '        related: []',
  ].join('\n'), 'utf8');

  const signal = await loadSkillSignal([], index(), [path]);

  expect(signal).toEqual({
    mastered: 1,
    learning: 1,
    planned: 1,
    percent: 50,
    source: 'skills',
  });
});

it('falls back to actual Knowledge statuses when the skills file is missing or invalid', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skills-'));
  const invalidPath = join(directory, 'skills.yaml');
  await writeFile(invalidPath, [
    'fields:',
    '  - id: database',
    '    children:',
    '      - id: valid-leaf',
    '        status: mastered',
    '      - id: missing-status',
  ].join('\n'), 'utf8');
  const entries = [
    { kind: 'knowledge', category: 'Database', status: 'mastered' },
    { kind: 'knowledge', category: 'AI', status: 'growing' },
    { kind: 'knowledge', category: 'Research', status: 'seed' },
    { kind: 'logs', category: 'Learning' },
  ] satisfies ContentStatsEntry[];

  await expect(loadSkillSignal(entries, index(), [join(directory, 'missing.yaml')])).resolves.toEqual({
    mastered: 1,
    learning: 1,
    planned: 1,
    percent: 50,
    source: 'knowledge',
  });
  await expect(loadSkillSignal(entries, index(), [invalidPath])).resolves.toEqual({
    mastered: 1,
    learning: 1,
    planned: 1,
    percent: 50,
    source: 'knowledge',
  });
});

it('rejects a skills tree whose leaves omit required Task 10 fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skills-'));
  const path = join(directory, 'skills.yaml');
  await writeFile(path, [
    'fields:',
    '  - id: database',
    '    label: 데이터베이스',
    '    children:',
    '      - id: b-tree',
    '        status: mastered',
  ].join('\n'), 'utf8');
  const entries = [
    { kind: 'knowledge', category: 'Database', status: 'growing' },
  ] satisfies ContentStatsEntry[];

  await expect(loadSkillSignal(entries, index(), [path])).resolves.toEqual({
    mastered: 0,
    learning: 1,
    planned: 0,
    percent: 50,
    source: 'knowledge',
  });
});

it('continues past an invalid candidate and activates the next valid skills tree', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-skills-'));
  const invalidPath = join(directory, 'skills.yaml');
  const validPath = join(directory, 'data-skills.yaml');
  await Promise.all([
    writeFile(invalidPath, 'fields: invalid\n', 'utf8'),
    writeFile(validPath, [
      'fields:',
      '  - id: database',
      '    label: 데이터베이스',
      '    children:',
      '      - id: b-tree',
      '        label: B-Tree',
      '        status: mastered',
      '        related: [knowledge/database/b-tree-index]',
    ].join('\n'), 'utf8'),
  ]);
  const entries = [
    { kind: 'knowledge', category: 'Database', status: 'seed' },
  ] satisfies ContentStatsEntry[];

  await expect(loadSkillSignal(entries, index(), [invalidPath, validPath])).resolves.toEqual({
    mastered: 1,
    learning: 0,
    planned: 0,
    percent: 100,
    source: 'skills',
  });
});

it('uses the same canonical candidate as the skills page when legacy and canonical files coexist', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-home-skills-'));
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
      '        related: [B-Tree Index]',
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

  await expect(loadSkillSignal([], index(), [legacyPath, canonicalPath])).resolves.toEqual({
    mastered: 1,
    learning: 0,
    planned: 0,
    percent: 100,
    source: 'skills',
  });
});

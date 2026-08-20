import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import {
  calculateContentStats,
  loadSkillSignal,
} from '../../src/lib/content/stats';
import type { ContentStatsEntry } from '../../src/lib/content/stats';

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

  const signal = await loadSkillSignal([], [path]);

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

  await expect(loadSkillSignal(entries, [join(directory, 'missing.yaml')])).resolves.toEqual({
    mastered: 1,
    learning: 1,
    planned: 1,
    percent: 50,
    source: 'knowledge',
  });
  await expect(loadSkillSignal(entries, [invalidPath])).resolves.toEqual({
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

  await expect(loadSkillSignal(entries, [path])).resolves.toEqual({
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

  await expect(loadSkillSignal(entries, [invalidPath, validPath])).resolves.toEqual({
    mastered: 1,
    learning: 0,
    planned: 0,
    percent: 100,
    source: 'skills',
  });
});

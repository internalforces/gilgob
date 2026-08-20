import { describe, expect, it } from 'vitest';
import type { ContentIndex } from '../../src/lib/content/types';
import {
  filterAndSortEntries,
  normalizeEntry,
  resolveEntryRelations,
} from '../../src/lib/content/queries';

const commonData = {
  description: '설명',
  category: 'Computer Science',
  tags: ['Index'],
  created: new Date('2026-08-01'),
  draft: false,
  aliases: [],
  featured: false,
};

describe('content queries', () => {
  it('removes drafts in production and sorts by updated date', () => {
    const rows = [
      { id: 'a', data: { ...commonData, title: '가', updated: new Date('2026-08-20') } },
      { id: 'b', data: { ...commonData, title: '나', draft: true, created: new Date('2026-08-21') } },
      { id: 'c', data: { ...commonData, title: '다', created: new Date('2026-08-10') } },
    ];

    expect(filterAndSortEntries(rows, true).map((row) => row.id)).toEqual(['a', 'c']);
  });

  it('uses the Korean title as a stable tie-breaker', () => {
    const rows = [
      { id: 'later-title', data: { ...commonData, title: '하늘' } },
      { id: 'earlier-title', data: { ...commonData, title: '가람' } },
    ];

    expect(filterAndSortEntries(rows, false).map((row) => row.id)).toEqual([
      'earlier-title',
      'later-title',
    ]);
  });

  it('normalizes custom slugs, URLs, and retained Markdown bodies', () => {
    const entry = normalizeEntry('knowledge', {
      id: 'database/b-tree-index',
      body: '# B-Tree',
      data: { ...commonData, title: 'B-Tree', slug: 'database/index-structure' },
    });

    expect(entry).toMatchObject({
      id: 'knowledge/database/index-structure',
      kind: 'knowledge',
      slug: 'database/index-structure',
      url: '/knowledge/database/index-structure',
      body: '# B-Tree',
    });
  });

  it('resolves public backlink and related records in stored order', () => {
    const index = {
      generatedAt: '2026-08-20T00:00:00.000Z',
      graph: { nodes: [], edges: [] },
      documents: [
        record({ id: 'knowledge/source', title: '원문', backlinks: ['logs/link'], related: ['knowledge/related', 'knowledge/draft'] }),
        record({ id: 'logs/link', kind: 'logs', slug: 'link', title: '연결 기록' }),
        record({ id: 'knowledge/related', slug: 'related', title: '관련 지식' }),
        record({ id: 'knowledge/draft', slug: 'draft', title: '초안', draft: true }),
      ],
    } satisfies ContentIndex;

    const relations = resolveEntryRelations(index, 'knowledge/source', true);

    expect(relations.backlinks.map(({ id }) => id)).toEqual(['logs/link']);
    expect(relations.related.map(({ id }) => id)).toEqual(['knowledge/related']);
  });
});

function record(overrides: Partial<ContentIndex['documents'][number]>) {
  return {
    id: 'knowledge/source',
    kind: 'knowledge' as const,
    slug: 'source',
    url: '/knowledge/source',
    title: '원문',
    description: '설명',
    category: 'Computer Science',
    tags: [],
    aliases: [],
    created: '2026-08-20',
    updated: '2026-08-20',
    draft: false,
    featured: false,
    sourcePath: 'knowledge/source.md',
    outgoing: [],
    backlinks: [],
    related: [],
    ...overrides,
  };
}

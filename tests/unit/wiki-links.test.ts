import { describe, expect, it } from 'vitest';
import { parseWikiLinks, resolveWikiLink } from '../../src/lib/content/wiki-links';
import type { ContentIndex } from '../../src/lib/content/types';

describe('wiki links', () => {
  it('parses aliases, headings, embeds, and ignores code', () => {
    const source = '[[B-Tree#왜 필요한가|인덱스]] ![[attachments/tree.png]] `[[무시]]`\n```sql\n[[무시2]]\n```';

    expect(parseWikiLinks(source).map(({ target, heading, label, embed }) => ({ target, heading, label, embed }))).toEqual([
      { target: 'B-Tree', heading: '왜 필요한가', label: '인덱스', embed: false },
      { target: 'attachments/tree.png', heading: undefined, label: 'attachments/tree.png', embed: true },
    ]);
  });

  it('resolves a normalized alias and preserves the heading', () => {
    const index = {
      documents: [{ id: 'knowledge/database/b-tree', title: 'B-Tree', aliases: ['B-Tree Index'], url: '/knowledge/database/b-tree' }],
      graph: { nodes: [], edges: [] },
      generatedAt: '',
    } as unknown as ContentIndex;
    const token = parseWikiLinks('[[B-Tree Index#구조]]')[0];

    expect(resolveWikiLink(token, 'source', index)).toMatchObject({
      found: true,
      href: '/knowledge/database/b-tree#%EA%B5%AC%EC%A1%B0',
    });
  });

  it('resolves an exact relative source path', () => {
    const index = {
      documents: [
        { id: 'knowledge/reference/topic', title: 'Topic', aliases: [], url: '/knowledge/reference/topic', sourcePath: 'knowledge/reference/topic.md' },
        { id: 'knowledge/notes/topic', title: 'topic', aliases: [], url: '/knowledge/notes/topic', sourcePath: 'knowledge/notes/topic.md' },
      ],
      graph: { nodes: [], edges: [] },
      generatedAt: '',
    } as unknown as ContentIndex;

    expect(resolveWikiLink(parseWikiLinks('[[../reference/topic]]')[0], 'knowledge/notes/source', index)).toMatchObject({
      found: true,
      documentId: 'knowledge/reference/topic',
    });
  });

  it('prefers a source-relative path when a direct path also matches', () => {
    const index = {
      documents: [
        { id: 'knowledge/topic', title: 'Direct topic', aliases: [], url: '/knowledge/topic', sourcePath: 'topic.md' },
        { id: 'knowledge/notes/topic', title: 'Relative topic', aliases: [], url: '/knowledge/notes/topic', sourcePath: 'knowledge/notes/topic.md' },
      ],
      graph: { nodes: [], edges: [] },
      generatedAt: '',
    } as unknown as ContentIndex;

    expect(resolveWikiLink(parseWikiLinks('[[topic]]')[0], 'knowledge/notes/source', index)).toMatchObject({
      found: true,
      documentId: 'knowledge/notes/topic',
    });
  });

  it('rejects ambiguous matches within a resolution stage', () => {
    const index = {
      documents: [
        { id: 'knowledge/one', title: 'One', aliases: ['Shared'], url: '/knowledge/one' },
        { id: 'knowledge/two', title: 'Two', aliases: ['Shared'], url: '/knowledge/two' },
      ],
      graph: { nodes: [], edges: [] },
      generatedAt: '',
    } as unknown as ContentIndex;

    expect(() => resolveWikiLink(parseWikiLinks('[[Shared]]')[0], 'source', index)).toThrow('Ambiguous wiki link');
  });
});

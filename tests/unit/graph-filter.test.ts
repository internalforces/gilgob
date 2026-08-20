import { describe, expect, it } from 'vitest';
import {
  filterGraph,
  graphForDocuments,
  toEgoGraph,
} from '../../src/lib/graph/filter';
import type { GraphData } from '../../src/lib/content/types';

const graph: GraphData = {
  nodes: [
    { id: 'tag:shared', label: 'Shared', kind: 'tag', group: 'tag' },
    { id: 'document:c', label: 'C', kind: 'document', group: 'logs', url: '/logs/c' },
    { id: 'category:database', label: 'Database', kind: 'category', group: 'category' },
    { id: 'document:a', label: 'A', kind: 'document', group: 'knowledge', url: '/knowledge/a' },
    { id: 'tag:ml', label: 'ML', kind: 'tag', group: 'tag' },
    { id: 'document:b', label: 'B', kind: 'document', group: 'projects', url: '/projects/b' },
    { id: 'category:ai', label: 'AI', kind: 'category', group: 'category' },
    { id: 'tag:sql', label: 'SQL', kind: 'tag', group: 'tag' },
  ],
  edges: [
    { id: 'tag:document:c:tag:sql', source: 'document:c', target: 'tag:sql', kind: 'tag' },
    { id: 'category:document:a:category:ai', source: 'document:a', target: 'category:ai', kind: 'category' },
    { id: 'wikilink:document:a:document:b', source: 'document:a', target: 'document:b', kind: 'wikilink' },
    { id: 'tag:document:a:tag:shared', source: 'document:a', target: 'tag:shared', kind: 'tag' },
    { id: 'category:document:c:category:database', source: 'document:c', target: 'category:database', kind: 'category' },
    { id: 'category:document:b:category:ai', source: 'document:b', target: 'category:ai', kind: 'category' },
    { id: 'tag:document:b:tag:ml', source: 'document:b', target: 'tag:ml', kind: 'tag' },
    { id: 'tag:document:c:tag:shared', source: 'document:c', target: 'tag:shared', kind: 'tag' },
  ],
};

describe('filterGraph', () => {
  it('keeps matching documents and only taxonomy nodes connected to them in stable ID order', () => {
    const filtered = filterGraph(graph, { categories: ['AI'], kinds: [], tags: [] });

    expect(filtered.nodes.map((node) => node.id)).toEqual([
      'category:ai',
      'document:a',
      'document:b',
      'tag:ml',
      'tag:shared',
    ]);
    expect(filtered.edges.map((edge) => edge.id)).toEqual([
      'category:document:a:category:ai',
      'category:document:b:category:ai',
      'tag:document:a:tag:shared',
      'tag:document:b:tag:ml',
      'wikilink:document:a:document:b',
    ]);
  });

  it('treats empty facets as unrestricted, values within a facet as OR, and facets as AND', () => {
    expect(filterGraph(graph, {
      categories: ['AI', 'Database'],
      kinds: ['knowledge', 'logs'],
      tags: ['ML', 'SQL'],
    }).nodes.filter((node) => node.kind === 'document').map((node) => node.id)).toEqual(['document:c']);

    expect(filterGraph(graph, { categories: [], kinds: [], tags: [] }).nodes.map((node) => node.id)).toEqual([
      'category:ai',
      'category:database',
      'document:a',
      'document:b',
      'document:c',
      'tag:ml',
      'tag:shared',
      'tag:sql',
    ]);
  });

  it('indexes a synthetic graph without repeated linear node scans', () => {
    const nodeCount = 400;
    const synthetic: GraphData = {
      nodes: [
        ...Array.from({ length: nodeCount }, (_, index) => ({
          id: `document:${index}`,
          label: `문서 ${index}`,
          kind: 'document' as const,
          group: index % 2 === 0 ? 'knowledge' : 'logs',
        })),
        { id: 'category:shared', label: 'Computer Science', kind: 'category', group: 'category' },
        { id: 'tag:shared', label: 'Shared', kind: 'tag', group: 'tag' },
      ],
      edges: Array.from({ length: nodeCount }, (_, index) => ([
        { id: `category:${index}`, source: `document:${index}`, target: 'category:shared', kind: 'category' as const },
        { id: `tag:${index}`, source: `document:${index}`, target: 'tag:shared', kind: 'tag' as const },
      ])).flat(),
    };
    Object.defineProperty(synthetic.nodes, 'find', {
      value: () => { throw new Error('graph filtering must use a node index, not nodes.find()'); },
    });

    const filtered = filterGraph(synthetic, {
      categories: ['Computer Science'],
      kinds: ['knowledge'],
      tags: ['Shared'],
    });

    expect(filtered.nodes.filter((node) => node.kind === 'document')).toHaveLength(nodeCount / 2);
    expect(filtered.edges).toHaveLength(nodeCount);
  });
});

describe('graphForDocuments', () => {
  it('cannot retain a private document or taxonomy connected only to it', () => {
    const publicGraph = graphForDocuments(graph, new Set(['document:a', 'document:c']));

    expect(publicGraph.nodes.map((node) => node.id)).toEqual([
      'category:ai',
      'category:database',
      'document:a',
      'document:c',
      'tag:shared',
      'tag:sql',
    ]);
    expect(publicGraph.edges.some((edge) => edge.source === 'document:b' || edge.target === 'document:b')).toBe(false);
  });
});

describe('toEgoGraph', () => {
  it('keeps the selected document and only its direct neighbors', () => {
    const ego = toEgoGraph(graph, 'document:a');

    expect(ego.nodes.map((node) => node.id)).toEqual([
      'category:ai',
      'document:a',
      'document:b',
      'tag:shared',
    ]);
    expect(ego.edges.map((edge) => edge.id)).toEqual([
      'category:document:a:category:ai',
      'tag:document:a:tag:shared',
      'wikilink:document:a:document:b',
    ]);
  });
});

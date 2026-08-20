import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { remarkObsidian } from '../../src/lib/markdown/remark-obsidian';
import type { ContentIndex } from '../../src/lib/content/types';

const index = {
  documents: [{
    id: 'knowledge/b-tree',
    kind: 'knowledge',
    slug: 'b-tree',
    title: 'B-Tree',
    description: '',
    category: '',
    tags: [],
    aliases: [],
    url: '/knowledge/b-tree',
    created: '2026-08-20',
    updated: '2026-08-20',
    draft: false,
    featured: false,
    sourcePath: 'knowledge/b-tree.md',
    outgoing: [],
    backlinks: [],
    related: [],
  }],
  graph: { nodes: [], edges: [] },
  generatedAt: '',
} satisfies ContentIndex;

it('turns resolved and unresolved wiki links into semantic nodes', async () => {
  const processor = unified().use(remarkParse).use(remarkObsidian, { index, base: '/repo' });
  const transformed = await processor.run(processor.parse('[[B-Tree]] [[없는 글]]'));

  expect(JSON.stringify(transformed)).toContain('/repo/knowledge/b-tree');
  expect(JSON.stringify(transformed)).toContain('wiki-link--missing');
});

it('reloads a file-backed index for every transformation on the same processor', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gilgob-remark-index-'));
  const indexPath = join(directory, 'content-index.json');
  const processor = unified().use(remarkParse).use(remarkObsidian, { indexPath, base: '/repo' });

  try {
    await writeFile(indexPath, JSON.stringify({ ...index, documents: [] }));
    const before = await processor.run(processor.parse('[[B-Tree]]'));
    expect(JSON.stringify(before)).toContain('wiki-link--missing');

    await writeFile(indexPath, JSON.stringify(index));
    const after = await processor.run(processor.parse('[[B-Tree]]'));
    expect(after.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'link', url: '/repo/knowledge/b-tree' }],
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('resolves relative wiki links when the source file path begins with content/', async () => {
  const processor = unified().use(remarkParse).use(remarkObsidian, { index, base: '/repo' });
  const transformed = await processor.run(
    processor.parse('[[../../knowledge/b-tree|상대 링크]]'),
    { path: 'content/explorations/notes/source.md' },
  );

  expect(transformed.children[0]).toMatchObject({
    type: 'paragraph',
    children: [{ type: 'link', url: '/repo/knowledge/b-tree' }],
  });
});

it('replaces only wiki-link ranges and renders safe attachment embeds', async () => {
  const transformed = await transform('앞 [[B-Tree|인덱스]] 뒤 ![[attachments/diagram 한글.png|B-Tree 그림]] 끝');
  const paragraph = transformed.children[0];

  expect(paragraph).toMatchObject({
    type: 'paragraph',
    children: [
      { type: 'text', value: '앞 ' },
      { type: 'link', url: '/repo/knowledge/b-tree', children: [{ type: 'text', value: '인덱스' }] },
      { type: 'text', value: ' 뒤 ' },
      { type: 'image', url: '/repo/content-assets/diagram%20%ED%95%9C%EA%B8%80.png', alt: 'B-Tree 그림' },
      { type: 'text', value: ' 끝' },
    ],
  });
});

it('does not accept traversal or non-attachment embeds as images', async () => {
  const transformed = await transform('![[attachments/../../secret.png]] ![[B-Tree]]');

  expect(transformed.children[0]).toMatchObject({
    type: 'paragraph',
    children: [{ type: 'text', value: '![[attachments/../../secret.png]] ![[B-Tree]]' }],
  });
  expect(JSON.stringify(transformed)).not.toContain('content-assets');
});

it('does not transform wiki syntax inside Markdown link labels or reference link labels', async () => {
  const transformed = await transform('[기존 [[B-Tree]] 링크](https://example.com) [참조 [[B-Tree]]][ref]\n\n[ref]: https://example.com/ref');

  expect(transformed.children[0]).toMatchObject({
    type: 'paragraph',
    children: [
      { type: 'link', url: 'https://example.com', children: [{ type: 'text', value: '기존 [[B-Tree]] 링크' }] },
      { type: 'text', value: ' ' },
      { type: 'linkReference', children: [{ type: 'text', value: '참조 [[B-Tree]]' }] },
    ],
  });
});

it('does not transform wiki syntax nested under formatting inside Markdown links', async () => {
  const transformed = await transform('[**중첩 [[B-Tree]]**](https://example.com) [*참조 [[B-Tree]]*][ref]\n\n[ref]: https://example.com/ref');

  expect(transformed.children[0]).toMatchObject({
    type: 'paragraph',
    children: [
      {
        type: 'link',
        children: [{ type: 'strong', children: [{ type: 'text', value: '중첩 [[B-Tree]]' }] }],
      },
      { type: 'text', value: ' ' },
      {
        type: 'linkReference',
        children: [{ type: 'emphasis', children: [{ type: 'text', value: '참조 [[B-Tree]]' }] }],
      },
    ],
  });
  expect(JSON.stringify(transformed.children[0])).not.toContain('/repo/knowledge/b-tree');
});

it('still transforms standalone wiki syntax nested under formatting', async () => {
  const transformed = await transform('**중첩 [[B-Tree]]** *강조 [[B-Tree]]*');

  expect(transformed.children[0]).toMatchObject({
    type: 'paragraph',
    children: [
      {
        type: 'strong',
        children: [
          { type: 'text', value: '중첩 ' },
          { type: 'link', url: '/repo/knowledge/b-tree' },
        ],
      },
      { type: 'text', value: ' ' },
      {
        type: 'emphasis',
        children: [
          { type: 'text', value: '강조 ' },
          { type: 'link', url: '/repo/knowledge/b-tree' },
        ],
      },
    ],
  });
});

it('preserves wiki syntax inside inline and fenced code', async () => {
  const transformed = await transform('`[[B-Tree]]`\n\n```md\n[[B-Tree]]\n```');

  expect(transformed.children).toMatchObject([
    { type: 'paragraph', children: [{ type: 'inlineCode', value: '[[B-Tree]]' }] },
    { type: 'code', value: '[[B-Tree]]' },
  ]);
  expect(JSON.stringify(transformed)).not.toContain('/repo/knowledge/b-tree');
});

describe('Obsidian callouts', () => {
  const cases = [
    ['NOTE', 'note', '노트'],
    ['TIP', 'tip', '팁'],
    ['WARNING', 'warning', '경고'],
    ['IMPORTANT', 'important', '중요'],
    ['CAUTION', 'caution', '주의'],
  ] as const;

  it.each(cases)('turns %s blockquotes into labeled asides', async (kind, classSuffix, label) => {
    const transformed = await transform(`> [!${kind}]\n> 자세한 내용`);

    expect(transformed.children[0]).toMatchObject({
      type: 'blockquote',
      data: {
        hName: 'aside',
        hProperties: { className: ['callout', `callout--${classSuffix}`] },
      },
    });
    expect(JSON.stringify(transformed.children[0])).toContain(label);
    expect(JSON.stringify(transformed.children[0])).toContain('자세한 내용');
    expect(JSON.stringify(transformed.children[0])).not.toContain(`[!${kind}]`);
  });
});

it('requires exactly one content index source', () => {
  expect(() => {
    const processor = unified().use(remarkParse).use(remarkObsidian, { base: '/repo' });
    processor.parse('text');
  }).toThrow('exactly one');
  expect(() => {
    const processor = unified().use(remarkParse).use(remarkObsidian, {
      index,
      indexPath: '.cache/content-index.json',
      base: '/repo',
    });
    processor.parse('text');
  }).toThrow('exactly one');
});

async function transform(markdown: string) {
  const processor = unified().use(remarkParse).use(remarkObsidian, { index, base: '/repo' });
  return processor.run(processor.parse(markdown));
}

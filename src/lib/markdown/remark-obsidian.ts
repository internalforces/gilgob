import type { Blockquote, Paragraph, Root, RootContent, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { readContentIndex } from '../content/index-store';
import type { ContentIndex, WikiLinkToken } from '../content/types';
import { parseWikiLinks, resolveWikiLink } from '../content/wiki-links';
import { attachmentRelativePath } from '../content/attachment-path';

export interface RemarkObsidianOptions {
  index?: ContentIndex;
  indexPath?: string;
  base: string;
  publicOnly?: boolean;
}

const CALLOUTS = {
  NOTE: { classSuffix: 'note', label: '노트' },
  TIP: { classSuffix: 'tip', label: '팁' },
  WARNING: { classSuffix: 'warning', label: '경고' },
  IMPORTANT: { classSuffix: 'important', label: '중요' },
  CAUTION: { classSuffix: 'caution', label: '주의' },
} as const;

type CalloutKind = keyof typeof CALLOUTS;

export const remarkObsidian: Plugin<[RemarkObsidianOptions], Root> = function remarkObsidian(options) {
  const readIndex = createIndexReader(options);

  return (tree, file) => {
    const index = publicResolutionIndex(readIndex(), options.publicOnly ?? false);
    const sourceId = sourceIdFromPath(file.path);

    visit(tree, 'blockquote', transformCallout);
    const markdownLinkText = collectMarkdownLinkText(tree);

    visit(tree, 'text', (node, position, parent) => {
      if (position === undefined || parent === undefined) return;
      if (markdownLinkText.has(node)) return;
      const replacement = replaceWikiLinks(node, sourceId, index, options.base);
      if (replacement.length === 1 && replacement[0] === node) return;
      parent.children.splice(position, 1, ...replacement);
      return position + replacement.length;
    });
  };
};

function collectMarkdownLinkText(tree: Root): WeakSet<Text> {
  const linkedText = new WeakSet<Text>();
  visit(tree, (node) => {
    if (node.type !== 'link' && node.type !== 'linkReference') return;
    visit(node, 'text', (text) => {
      linkedText.add(text);
    });
  });
  return linkedText;
}

function publicResolutionIndex(index: ContentIndex, publicOnly: boolean): ContentIndex {
  if (!publicOnly) return index;
  return {
    ...index,
    documents: index.documents.filter((document) => !document.draft),
  };
}

function createIndexReader(options: RemarkObsidianOptions): () => ContentIndex {
  if ((options.index === undefined) === (options.indexPath === undefined)) {
    throw new Error('remarkObsidian requires exactly one of index or indexPath');
  }
  if (options.index !== undefined) {
    const index = options.index;
    return () => index;
  }

  const indexPath = options.indexPath!;
  return () => readContentIndex(indexPath);
}

function replaceWikiLinks(node: Text, sourceId: string, index: ContentIndex, base: string): RootContent[] {
  const tokens = parseWikiLinks(node.value).filter((token) => !token.embed || isSafeAttachmentTarget(token.target));
  if (tokens.length === 0) return [node];

  const replacement: RootContent[] = [];
  let cursor = 0;
  for (const token of tokens) {
    const start = node.value.indexOf(token.raw, cursor);
    if (start < 0) continue;
    if (start > cursor) replacement.push({ type: 'text', value: node.value.slice(cursor, start) });
    replacement.push(token.embed ? attachmentNode(token, base) : wikiLinkNode(token, sourceId, index, base));
    cursor = start + token.raw.length;
  }
  if (cursor < node.value.length) replacement.push({ type: 'text', value: node.value.slice(cursor) });

  return replacement;
}

function attachmentNode(token: WikiLinkToken, base: string): RootContent {
  const relativePath = attachmentRelativePath(token.target)!;
  return {
    type: 'image',
    url: joinBase(base, `/content-assets/${encodePath(relativePath)}`),
    alt: token.label,
  };
}

function isSafeAttachmentTarget(target: string): boolean {
  return attachmentRelativePath(target) !== null;
}

function encodePath(path: string): string {
  return path.normalize('NFC').split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

function wikiLinkNode(token: WikiLinkToken, sourceId: string, index: ContentIndex, base: string): RootContent {
  const resolved = resolveWikiLink(token, sourceId, index);
  if (resolved.found) {
    return {
      type: 'link',
      url: joinBase(base, resolved.href!),
      children: [{ type: 'text', value: resolved.label }],
      data: { hProperties: { className: ['wiki-link'] } },
    };
  }

  return {
    type: 'text',
    value: resolved.label,
    data: {
      hName: 'span',
      hProperties: {
        className: ['wiki-link', 'wiki-link--missing'],
        ariaLabel: '아직 작성되지 않은 문서',
      },
    },
  };
}

function transformCallout(node: Blockquote): void {
  const firstParagraph = node.children[0];
  if (firstParagraph?.type !== 'paragraph') return;
  const firstText = firstParagraph.children[0];
  if (firstText?.type !== 'text') return;

  const match = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\][ \t]*(?:\n)?/.exec(firstText.value);
  if (match === null) return;

  const callout = CALLOUTS[match[1] as CalloutKind];
  node.data = {
    ...node.data,
    hName: 'aside',
    hProperties: { className: ['callout', `callout--${callout.classSuffix}`] },
  };
  firstParagraph.children.splice(0, 1, ...calloutParagraphChildren(firstText, match[0].length, callout.label));
}

function calloutParagraphChildren(firstText: Text, markerLength: number, label: string): Paragraph['children'] {
  const remainder = firstText.value.slice(markerLength);
  return [
    {
      type: 'strong',
      data: { hProperties: { className: ['callout__label'] } },
      children: [{ type: 'text', value: label }],
    },
    ...(remainder === '' ? [] : [{ type: 'text' as const, value: remainder }]),
  ];
}

function joinBase(base: string, path: string): string {
  const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`.replace(/\/+/g, '/');
}

function sourceIdFromPath(path: string | undefined): string {
  if (path === undefined) return '';
  const normalized = path.replace(/\\/g, '/');
  const contentMarker = '/content/';
  const markerPosition = normalized.lastIndexOf(contentMarker);
  if (markerPosition >= 0) return normalized.slice(markerPosition + contentMarker.length);
  return normalized.startsWith('content/') ? normalized.slice('content/'.length) : normalized;
}

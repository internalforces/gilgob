import { posix } from 'node:path';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import type { ContentIndex, ContentRecord, ResolvedWikiLink, WikiLinkToken } from './types';

const WIKI_LINK_PATTERN = /(!?)\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

export class AmbiguousWikiLinkError extends Error {
  constructor(target: string) {
    super(`Ambiguous wiki link: ${target}`);
    this.name = 'AmbiguousWikiLinkError';
  }
}

export function parseWikiLinks(markdown: string): WikiLinkToken[] {
  const tokens: WikiLinkToken[] = [];
  const tree = unified().use(remarkParse).parse(markdown);

  visit(tree, 'text', (node) => {
    for (const match of node.value.matchAll(WIKI_LINK_PATTERN)) {
      const target = normalize(match[2]);
      const heading = match[3];
      const label = match[4] ?? target;

      tokens.push({
        raw: match[0],
        target,
        ...(heading === undefined ? {} : { heading }),
        label,
        embed: match[1] === '!',
      });
    }
  });

  return tokens;
}

export function resolveWikiLink(token: WikiLinkToken, sourceId: string, index: ContentIndex): ResolvedWikiLink {
  const target = normalize(token.target);
  const document = resolveDocument(target, sourceId, index.documents);

  if (document === undefined) {
    return withHeading({ found: false, label: token.label }, token.heading);
  }

  const href = token.heading === undefined
    ? document.url
    : `${document.url}#${encodeURIComponent(token.heading)}`;

  return withHeading({ found: true, href, documentId: document.id, label: token.label }, token.heading);
}

function resolveDocument(target: string, sourceId: string, documents: ContentRecord[]): ContentRecord | undefined {
  const targetPaths = new Set([normalizePath(target), relativePath(sourceId, target)]);
  const bySourcePath = documents.filter((document) => {
    if (!document.sourcePath) return false;
    return targetPaths.has(normalizePath(document.sourcePath));
  });
  const fromSourcePath = oneMatch(target, bySourcePath);
  if (fromSourcePath !== undefined) return fromSourcePath;

  const byTitle = documents.filter((document) => normalize(document.title) === target);
  const fromTitle = oneMatch(target, byTitle);
  if (fromTitle !== undefined) return fromTitle;

  const byAlias = documents.filter((document) => document.aliases.some((alias) => normalize(alias) === target));
  const fromAlias = oneMatch(target, byAlias);
  if (fromAlias !== undefined) return fromAlias;

  const foldedTarget = target.toLowerCase();
  const byFoldedName = documents.filter((document) =>
    normalize(document.title).toLowerCase() === foldedTarget
    || document.aliases.some((alias) => normalize(alias).toLowerCase() === foldedTarget),
  );

  return oneMatch(target, byFoldedName);
}

function oneMatch(target: string, matches: ContentRecord[]): ContentRecord | undefined {
  if (matches.length > 1) throw new AmbiguousWikiLinkError(target);
  return matches[0];
}

function relativePath(sourceId: string, target: string): string {
  return normalizePath(posix.join(posix.dirname(normalizePath(sourceId)), target));
}

function normalizePath(value: string): string {
  return posix.normalize(normalize(value).replace(/\.(?:md|mdx)$/i, ''));
}

function normalize(value: string): string {
  return value.normalize('NFC').trim();
}

function withHeading(link: Omit<ResolvedWikiLink, 'heading'>, heading: string | undefined): ResolvedWikiLink {
  return heading === undefined ? link : { ...link, heading };
}

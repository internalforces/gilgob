import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { explorationSchema, knowledgeSchema, logSchema, projectSchema } from './schema';
import type { ContentFrontmatter } from './schema';
import type { ContentIndex, ContentKind, ContentRecord, GraphEdge, GraphNode } from './types';
import { parseWikiLinks, resolveWikiLink } from './wiki-links';

const CONTENT_KINDS: ContentKind[] = ['knowledge', 'explorations', 'projects', 'logs'];
const schemas = {
  knowledge: knowledgeSchema,
  explorations: explorationSchema,
  projects: projectSchema,
  logs: logSchema,
};

interface ParsedDocument {
  record: ContentRecord;
  body: string;
}

export async function buildContentIndex(contentRoot: string): Promise<ContentIndex> {
  const paths = await fg(CONTENT_KINDS.map((kind) => `${kind}/**/*.{md,mdx}`), {
    cwd: contentRoot,
    onlyFiles: true,
  });
  const parsed = await Promise.all(paths.sort().map((path) => parseDocument(contentRoot, path)));
  const documents = parsed.map(({ record }) => record);

  validateUniqueDocuments(documents);

  const index: ContentIndex = {
    documents,
    graph: { nodes: [], edges: [] },
    generatedAt: new Date().toISOString(),
  };

  for (const { record, body } of parsed) {
    await deriveOutgoingLinks(record, body, contentRoot, index);
  }

  deriveBacklinks(documents);
  deriveRelatedEntries(documents);
  index.graph = deriveGraph(documents);

  return index;
}

async function parseDocument(contentRoot: string, sourcePath: string): Promise<ParsedDocument> {
  const kind = sourcePath.split('/')[0] as ContentKind;
  const source = await readFile(resolve(contentRoot, sourcePath), 'utf8');
  const parsed = matter(source);
  const frontmatter = schemas[kind].parse(parsed.data) as ContentFrontmatter;
  const relativePath = sourcePath.slice(kind.length + 1).replace(/\.(?:md|mdx)$/i, '');
  const slug = frontmatter.slug ?? relativePath;
  const id = `${kind}/${slug}`;

  return {
    record: {
      id,
      kind,
      slug,
      url: `/${kind}/${slug}`,
      title: frontmatter.title,
      description: frontmatter.description,
      category: frontmatter.category,
      tags: frontmatter.tags,
      aliases: frontmatter.aliases,
      ...(frontmatter.status === undefined ? {} : { status: frontmatter.status }),
      created: formatDate(frontmatter.created),
      updated: formatDate(frontmatter.updated ?? frontmatter.created),
      draft: frontmatter.draft,
      featured: frontmatter.featured,
      sourcePath,
      outgoing: [],
      backlinks: [],
      related: [],
    },
    body: parsed.content,
  };
}

function validateUniqueDocuments(documents: ContentRecord[]): void {
  assertUnique(documents, (document) => normalizeName(document.slug), '중복 슬러그');
  validateUniqueNames(documents);
}

function assertUnique<T>(items: T[], keyFor: (item: T) => string, label: string): void {
  const seen = new Set<string>();

  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) throw new Error(`[content] ${label}: ${key}`);
    seen.add(key);
  }
}

function validateUniqueNames(documents: ContentRecord[]): void {
  const owners = new Map<string, { documentId: string; kind: 'title' | 'alias' }>();

  for (const document of documents) {
    const names = [
      { value: document.title, kind: 'title' as const },
      ...document.aliases.map((value) => ({ value, kind: 'alias' as const })),
    ];

    for (const name of names) {
      const key = normalizeName(name.value);
      const owner = owners.get(key);
      if (owner === undefined) {
        owners.set(key, { documentId: document.id, kind: name.kind });
        continue;
      }
      if (owner.documentId === document.id) continue;

      const label = owner.kind === name.kind
        ? name.kind === 'title' ? '중복 제목' : '중복 별칭'
        : '중복 제목 또는 별칭';
      throw new Error(`[content] ${label}: ${key}`);
    }
  }
}

async function deriveOutgoingLinks(
  document: ContentRecord,
  body: string,
  contentRoot: string,
  index: ContentIndex,
): Promise<void> {
  const outgoing = new Set<string>();

  for (const token of parseWikiLinks(body)) {
    if (token.embed) {
      if (token.target.startsWith('attachments/')) {
        await warnIfAttachmentMissing(contentRoot, token.target);
      }
      continue;
    }

    const resolved = resolveWikiLink(token, document.sourcePath, index);
    if (!resolved.found || resolved.documentId === undefined) {
      console.warn(`[content] 해결되지 않은 링크: ${token.target}`);
      continue;
    }
    outgoing.add(resolved.documentId);
  }

  document.outgoing = [...outgoing];
}

async function warnIfAttachmentMissing(contentRoot: string, target: string): Promise<void> {
  try {
    await access(resolve(contentRoot, target));
  } catch {
    console.warn(`[content] 누락된 첨부: ${target}`);
  }
}

function deriveBacklinks(documents: ContentRecord[]): void {
  const byId = new Map(documents.map((document) => [document.id, document]));

  for (const document of documents) {
    for (const targetId of document.outgoing) {
      const target = byId.get(targetId);
      if (target !== undefined && !target.backlinks.includes(document.id)) {
        target.backlinks.push(document.id);
      }
    }
  }
}

function deriveRelatedEntries(documents: ContentRecord[]): void {
  for (const document of documents) {
    const scores = documents
      .filter((candidate) => candidate.id !== document.id)
      .map((candidate) => ({
        document: candidate,
        score: 4 * Number(document.outgoing.includes(candidate.id))
          + 2 * Number(document.category === candidate.category)
          + sharedTagCount(document, candidate),
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.document.title.localeCompare(right.document.title, 'ko'));

    document.related = scores.slice(0, 5).map(({ document: candidate }) => candidate.id);
  }
}

function sharedTagCount(left: ContentRecord, right: ContentRecord): number {
  const rightTags = new Set(right.tags);
  return new Set(left.tags.filter((tag) => rightTags.has(tag))).size;
}

function deriveGraph(documents: ContentRecord[]): ContentIndex['graph'] {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  for (const document of documents) {
    nodes.set(document.id, {
      id: document.id,
      label: document.title,
      kind: 'document',
      group: document.kind,
      url: document.url,
    });

    const categoryId = `category:${document.category}`;
    nodes.set(categoryId, { id: categoryId, label: document.category, kind: 'category', group: 'category' });
    addEdge(edges, document.id, categoryId, 'category');

    for (const tag of new Set(document.tags)) {
      const tagId = `tag:${tag}`;
      nodes.set(tagId, { id: tagId, label: tag, kind: 'tag', group: 'tag' });
      addEdge(edges, document.id, tagId, 'tag');
    }

    for (const targetId of document.outgoing) {
      addEdge(edges, document.id, targetId, 'wikilink');
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

function addEdge(
  edges: Map<string, GraphEdge>,
  source: string,
  target: string,
  kind: GraphEdge['kind'],
): void {
  const id = `${kind}:${source}:${target}`;
  edges.set(id, { id, source, target, kind });
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeName(value: string): string {
  return value.normalize('NFC').trim().toLowerCase();
}

import type { ContentFrontmatter } from './schema';
import { readContentIndex } from './index-store';
import type { ContentIndex, ContentKind, ContentRecord } from './types';

interface QueryEntry {
  id: string;
  body?: string;
  data: ContentFrontmatter;
}

export interface NormalizedEntry {
  id: string;
  kind: ContentKind;
  slug: string;
  url: string;
  data: ContentFrontmatter;
  body: string;
}

export function filterAndSortEntries<T extends QueryEntry>(entries: T[], production: boolean): T[] {
  return entries
    .filter((entry) => !production || !entry.data.draft)
    .sort((left, right) => {
      const dateDifference = entryDate(right).getTime() - entryDate(left).getTime();
      return dateDifference || left.data.title.localeCompare(right.data.title, 'ko');
    });
}

export function normalizeEntry(kind: ContentKind, entry: QueryEntry): NormalizedEntry {
  const sourceSlug = entry.id.replace(/\.(?:md|mdx)$/i, '');
  const slug = entry.data.slug ?? sourceSlug;

  return {
    id: `${kind}/${slug}`,
    kind,
    slug,
    url: `/${kind}/${slug}`,
    data: entry.data,
    body: entry.body ?? '',
  };
}

export async function getPublicEntries(kind?: ContentKind): Promise<NormalizedEntry[]> {
  const { getCollection } = await import('astro:content');
  const kinds: ContentKind[] = kind
    ? [kind]
    : ['knowledge', 'explorations', 'projects', 'logs'];
  const production = isProductionBuild();
  const entries = await Promise.all(kinds.map(async (entryKind) => {
    const collection = await getCollection(entryKind);
    return filterAndSortEntries(collection as QueryEntry[], production)
      .map((entry) => normalizeEntry(entryKind, entry));
  }));

  return entries.flat().sort((left, right) => {
    const dateDifference = entryDate(right).getTime() - entryDate(left).getTime();
    return dateDifference || left.data.title.localeCompare(right.data.title, 'ko');
  });
}

export function getEntryRelations(id: string): {
  backlinks: ContentRecord[];
  related: ContentRecord[];
} {
  return resolveEntryRelations(readContentIndex(), id, isProductionBuild());
}

export function isProductionBuild(): boolean {
  return import.meta.env.PROD || process.env.NODE_ENV === 'production';
}

export function resolveEntryRelations(
  index: ContentIndex,
  id: string,
  production: boolean,
): { backlinks: ContentRecord[]; related: ContentRecord[] } {
  const entry = index.documents.find((document) => document.id === id);
  if (entry === undefined) return { backlinks: [], related: [] };

  const documents = new Map(index.documents.map((document) => [document.id, document]));
  const resolve = (ids: string[]) => ids
    .map((relationId) => documents.get(relationId))
    .filter((document): document is ContentRecord => (
      document !== undefined && (!production || !document.draft)
    ));

  return {
    backlinks: resolve(entry.backlinks),
    related: resolve(entry.related),
  };
}

function entryDate(entry: QueryEntry): Date {
  return entry.data.updated ?? entry.data.created;
}

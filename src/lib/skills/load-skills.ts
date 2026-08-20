import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import type { ContentIndex, ContentRecord } from '../content/types';
import { skillTreeDocumentSchema } from './schema';
import { collectSkillNodes } from './tree';
import type {
  SkillField,
  SkillNode,
  SkillTreeData,
} from './tree';
import { calculateSkillProgress } from './progress';

export { calculateFieldProgress, calculateSkillProgress } from './progress';

type LinkedNode = Pick<SkillNode, 'id' | 'related'>;

export const DEFAULT_SKILL_PATHS = [
  resolve('content/data/skills.yaml'),
  resolve('content/skills.yaml'),
];

export interface SkillTreeSelection {
  data: SkillTreeData | null;
  path?: string;
  errors: Error[];
}

export function validateSkillLinks(
  nodes: readonly LinkedNode[],
  documents: readonly ContentRecord[],
  fieldId = 'unknown',
): void {
  for (const node of nodes) {
    for (const relatedId of node.related) {
      resolveSkillReference(relatedId, documents, fieldId, node.id);
    }
  }
}

export async function loadSkills(path: string, index: ContentIndex): Promise<SkillTreeData> {
  const source = await readFile(path, 'utf8');
  const parsed = skillTreeDocumentSchema.safeParse(load(source));

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    throw new Error(`[skills] "${path}" 스킬 트리 스키마가 올바르지 않습니다. ${issues}`);
  }

  const fields = parsed.data.fields.map((field) => normalizeFieldLinks(field, index.documents));

  return {
    fields,
    progress: calculateSkillProgress(collectSkillNodes(fields)),
  };
}

export async function loadSkillsFromCandidates(
  index: ContentIndex,
  paths: string[] = DEFAULT_SKILL_PATHS,
): Promise<SkillTreeSelection> {
  const errors: Error[] = [];

  for (const path of prioritizeSkillPaths(paths)) {
    try {
      return { data: await loadSkills(path, index), path, errors };
    } catch (error) {
      if (!isMissingFile(error)) errors.push(toError(error));
    }
  }

  return { data: null, errors };
}

function normalizeFieldLinks(field: SkillField, documents: readonly ContentRecord[]): SkillField {
  return {
    ...field,
    children: field.children.map((child) => (
      'children' in child
        ? normalizeFieldLinks(child, documents)
        : normalizeSkillLinks(child, documents, field.id)
    )),
  };
}

function normalizeSkillLinks(
  skill: SkillNode,
  documents: readonly ContentRecord[],
  fieldId: string,
): SkillNode {
  const related = skill.related.map((reference) => (
    resolveSkillReference(reference, documents, fieldId, skill.id).id
  ));

  return { ...skill, related: [...new Set(related)] };
}

function resolveSkillReference(
  reference: string,
  documents: readonly ContentRecord[],
  fieldId: string,
  skillId: string,
): ContentRecord {
  const document = documents.find((candidate) => candidate.id === reference)
    ?? documents.find((candidate) => candidate.slug === reference)
    ?? documents.find((candidate) => candidate.aliases.includes(reference));

  if (document === undefined) {
    throw skillLinkError(fieldId, skillId, `존재하지 않는 관련 문서 "${reference}"`);
  }
  if (document.kind !== 'knowledge' || document.draft) {
    throw skillLinkError(
      fieldId,
      skillId,
      `공개 Knowledge 문서가 아닌 관련 문서 "${reference}"`,
    );
  }

  return document;
}

function skillLinkError(fieldId: string, skillId: string, detail: string): Error {
  return new Error(`[skills] 분야 "${fieldId}", 스킬 "${skillId}": ${detail}`);
}

function prioritizeSkillPaths(paths: string[]): string[] {
  return paths
    .map((path, index) => ({ path, index, canonical: isCanonicalSkillPath(path) }))
    .sort((left, right) => Number(right.canonical) - Number(left.canonical) || left.index - right.index)
    .map(({ path }) => path);
}

function isCanonicalSkillPath(path: string): boolean {
  return path.replaceAll('\\', '/').endsWith('/data/skills.yaml');
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

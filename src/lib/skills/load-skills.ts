import { readFile } from 'node:fs/promises';
import { load } from 'js-yaml';
import type { ContentIndex, ContentRecord } from '../content/types';
import {
  collectSkillNodes,
  skillTreeDocumentSchema,
} from './schema';
import type {
  SkillField,
  SkillNode,
  SkillTreeData,
} from './schema';
import { calculateSkillProgress } from './progress';

export { calculateFieldProgress, calculateSkillProgress } from './progress';

type LinkedNode = Pick<SkillNode, 'id' | 'related'>;

export function validateSkillLinks(
  nodes: readonly LinkedNode[],
  documents: readonly ContentRecord[],
  fieldId = 'unknown',
): void {
  const documentsById = new Map(documents.map((document) => [document.id, document]));

  for (const node of nodes) {
    for (const relatedId of node.related) {
      const document = documentsById.get(relatedId);
      if (document === undefined) {
        throw skillLinkError(fieldId, node.id, `존재하지 않는 관련 문서 "${relatedId}"`);
      }
      if (document.kind !== 'knowledge' || document.draft) {
        throw skillLinkError(
          fieldId,
          node.id,
          `공개 Knowledge 문서가 아닌 관련 문서 "${relatedId}"`,
        );
      }
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

  for (const field of parsed.data.fields) validateFieldLinks(field, index.documents);

  return {
    fields: parsed.data.fields,
    progress: calculateSkillProgress(collectSkillNodes(parsed.data.fields)),
  };
}

function validateFieldLinks(field: SkillField, documents: readonly ContentRecord[]): void {
  const skills = field.children.filter((child): child is SkillNode => !('children' in child));
  validateSkillLinks(skills, documents, field.id);

  for (const child of field.children) {
    if ('children' in child) validateFieldLinks(child, documents);
  }
}

function skillLinkError(fieldId: string, skillId: string, detail: string): Error {
  return new Error(`[skills] 분야 "${fieldId}", 스킬 "${skillId}": ${detail}`);
}

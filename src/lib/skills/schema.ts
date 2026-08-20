import { z } from 'astro/zod';
import type { SkillField, SkillNode, SkillTreeDocument } from './tree';

export const skillStatusSchema = z.enum(['mastered', 'learning', 'planned']);
export type { SkillField, SkillNode, SkillProgress, SkillStatus, SkillTreeData, SkillTreeDocument } from './tree';

const skillIdSchema = z.string()
  .trim()
  .min(1)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'ID는 영문자, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.');

export const skillNodeSchema: z.ZodType<SkillNode> = z.object({
  id: skillIdSchema,
  label: z.string().trim().min(1),
  status: skillStatusSchema,
  related: z.array(z.string().trim().min(1)),
}).strict();

export const skillFieldSchema: z.ZodType<SkillField> = z.lazy(() => z.object({
  id: skillIdSchema,
  label: z.string().trim().min(1),
  children: z.array(z.union([skillNodeSchema, skillFieldSchema])).min(1),
}).strict());

export const skillTreeDocumentSchema: z.ZodType<SkillTreeDocument> = z.object({
  fields: z.array(skillFieldSchema).min(1),
}).strict().superRefine((document, context) => {
  const seen = new Map<string, { kind: 'field' | 'skill'; path: Array<string | number> }>();

  const register = (
    id: string,
    kind: 'field' | 'skill',
    path: Array<string | number>,
  ) => {
    const previous = seen.get(id);
    if (previous === undefined) {
      seen.set(id, { kind, path });
      return;
    }

    context.addIssue({
      code: 'custom',
      path: [...path, 'id'],
      message: `중복 ID "${id}": ${previous.kind} ${formatSkillPath(previous.path)}와 ${kind} ${formatSkillPath(path)}`,
    });
  };

  const visitField = (field: SkillField, path: Array<string | number>) => {
    register(field.id, 'field', path);
    field.children.forEach((child, index) => {
      const childPath = [...path, 'children', index];
      if ('children' in child) visitField(child, childPath);
      else register(child.id, 'skill', childPath);
    });
  };

  document.fields.forEach((field, index) => visitField(field, ['fields', index]));
});

export function parseSkillTreeDocument(value: unknown): SkillTreeDocument | null {
  const result = skillTreeDocumentSchema.safeParse(value);
  return result.success ? result.data : null;
}

function formatSkillPath(path: Array<string | number>): string {
  return path.join('.');
}

import { z } from 'astro/zod';

export const skillStatusSchema = z.enum(['mastered', 'learning', 'planned']);
export type SkillStatus = z.infer<typeof skillStatusSchema>;

export interface SkillProgress {
  mastered: number;
  learning: number;
  planned: number;
  percent: number;
}

export interface SkillNode {
  id: string;
  label: string;
  status: SkillStatus;
  related: string[];
}

export interface SkillField {
  id: string;
  label: string;
  children: Array<SkillField | SkillNode>;
}

export interface SkillTreeDocument {
  fields: SkillField[];
}

export interface SkillTreeData extends SkillTreeDocument {
  progress: SkillProgress;
}

export const skillNodeSchema: z.ZodType<SkillNode> = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  status: skillStatusSchema,
  related: z.array(z.string().trim().min(1)),
}).strict();

export const skillFieldSchema: z.ZodType<SkillField> = z.lazy(() => z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  children: z.array(z.union([skillNodeSchema, skillFieldSchema])).min(1),
}).strict());

export const skillTreeDocumentSchema: z.ZodType<SkillTreeDocument> = z.object({
  fields: z.array(skillFieldSchema).min(1),
}).strict();

export function parseSkillTreeDocument(value: unknown): SkillTreeDocument | null {
  const result = skillTreeDocumentSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function collectSkillNodes(fields: SkillField[]): SkillNode[] {
  return fields.flatMap((field) => field.children.flatMap((child) => (
    'children' in child ? collectSkillNodes([child]) : [child]
  )));
}

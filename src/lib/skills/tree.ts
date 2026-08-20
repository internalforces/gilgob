export type SkillStatus = 'mastered' | 'learning' | 'planned';

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

export function collectSkillNodes(fields: SkillField[]): SkillNode[] {
  return fields.flatMap((field) => field.children.flatMap((child) => (
    'children' in child ? collectSkillNodes([child]) : [child]
  )));
}

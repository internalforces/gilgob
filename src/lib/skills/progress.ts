import { collectSkillNodes } from './tree';
import type {
  SkillField,
  SkillNode,
  SkillProgress,
  SkillStatus,
} from './tree';

type ProgressNode = Pick<SkillNode, 'id' | 'status'>;

export function calculateSkillProgress(nodes: readonly ProgressNode[]): SkillProgress {
  const counts: Record<SkillStatus, number> = {
    mastered: 0,
    learning: 0,
    planned: 0,
  };

  for (const node of nodes) counts[node.status] += 1;

  const total = nodes.length;
  const percent = total === 0
    ? 0
    : Math.round(((counts.mastered + counts.learning * 0.5) / total) * 100);

  return { ...counts, percent };
}

export function calculateFieldProgress(field: SkillField): SkillProgress {
  return calculateSkillProgress(collectSkillNodes([field]));
}

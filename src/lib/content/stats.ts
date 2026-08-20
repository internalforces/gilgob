import {
  DEFAULT_SKILL_PATHS,
  loadSkillsFromCandidates,
} from '../skills/load-skills';
import { calculateSkillProgress } from '../skills/progress';
import type { SkillProgress, SkillStatus } from '../skills/schema';
import type { ContentIndex, ContentKind } from './types';

export { DEFAULT_SKILL_PATHS } from '../skills/load-skills';

export interface ContentStatsEntry {
  kind: ContentKind;
  category: string;
  status?: string;
  outgoing?: string[];
}

export interface ContentStats {
  documents: number;
  connections: number;
  categories: number;
  activeExplorations: number;
}

export interface SkillSignal extends SkillProgress {
  source: 'skills' | 'knowledge';
}

export function calculateContentStats(entries: ContentStatsEntry[]): ContentStats {
  return {
    documents: entries.length,
    connections: entries.reduce((total, entry) => total + (entry.outgoing?.length ?? 0), 0),
    categories: new Set(entries.map((entry) => entry.category)).size,
    activeExplorations: entries.filter((entry) => (
      entry.kind === 'explorations' && entry.status === 'active'
    )).length,
  };
}

export async function loadSkillSignal(
  entries: ContentStatsEntry[],
  index: ContentIndex | null,
  paths: string[] = DEFAULT_SKILL_PATHS,
): Promise<SkillSignal> {
  if (index !== null) {
    const selection = await loadSkillsFromCandidates(index, paths);
    if (selection.data !== null) {
      return { ...selection.data.progress, source: 'skills' };
    }
  }

  return fallbackSkillSignal(entries);
}

function fallbackSkillSignal(entries: ContentStatsEntry[]): SkillSignal {
  const statusMap: Record<string, SkillStatus | undefined> = {
    mastered: 'mastered',
    growing: 'learning',
    seed: 'planned',
  };
  const statuses = entries
    .filter((entry) => entry.kind === 'knowledge')
    .map((entry) => entry.status === undefined ? undefined : statusMap[entry.status])
    .filter((status): status is SkillStatus => status !== undefined);

  return {
    ...calculateSkillProgress(statuses.map((status, index) => ({ id: `knowledge-${index}`, status }))),
    source: 'knowledge',
  };
}

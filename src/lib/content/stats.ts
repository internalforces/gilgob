import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { collectSkillNodes, parseSkillTreeDocument } from '../skills/schema';
import type { SkillStatus } from '../skills/schema';
import type { ContentKind } from './types';

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

export interface SkillSignal {
  mastered: number;
  learning: number;
  planned: number;
  percent: number;
  source: 'skills' | 'knowledge';
}

export const DEFAULT_SKILL_PATHS = [
  resolve('content/skills.yaml'),
  resolve('content/data/skills.yaml'),
];

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
  paths: string[] = DEFAULT_SKILL_PATHS,
): Promise<SkillSignal> {
  for (const path of paths) {
    try {
      const parsed = load(await readFile(path, 'utf8'));
      const tree = parseSkillTreeDocument(parsed);
      if (tree === null) continue;
      const statuses = collectSkillNodes(tree.fields).map((node) => node.status);
      return summarizeStatuses(statuses, 'skills');
    } catch (error) {
      if (isMissingFile(error)) continue;
      continue;
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

  return summarizeStatuses(statuses, 'knowledge');
}

function summarizeStatuses(
  statuses: SkillStatus[],
  source: SkillSignal['source'],
): SkillSignal {
  const counts = { mastered: 0, learning: 0, planned: 0 };
  for (const status of statuses) counts[status] += 1;
  const total = statuses.length;
  const percent = total === 0
    ? 0
    : Math.round(((counts.mastered + counts.learning * 0.5) / total) * 100);

  return { ...counts, percent, source };
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

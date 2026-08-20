import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
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

type SkillStatus = 'mastered' | 'learning' | 'planned';

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
      const statuses = collectSkillStatuses(parsed);
      if (statuses !== null) return summarizeStatuses(statuses, 'skills');
      return fallbackSkillSignal(entries);
    } catch (error) {
      if (isMissingFile(error)) continue;
      return fallbackSkillSignal(entries);
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

function collectSkillStatuses(value: unknown): SkillStatus[] | null {
  if (!isRecord(value) || !Array.isArray(value.fields)) return null;

  const statuses: SkillStatus[] = [];
  const visit = (node: unknown): boolean => {
    if (!isRecord(node)) return false;
    if (node.children !== undefined) {
      if (node.status !== undefined || !Array.isArray(node.children) || node.children.length === 0) return false;
      return node.children.every(visit);
    }
    if (typeof node.status !== 'string' || !isSkillStatus(node.status)) return false;
    statuses.push(node.status);
    return true;
  };

  if (!value.fields.every(visit) || statuses.length === 0) return null;
  return statuses;
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

function isSkillStatus(value: string): value is SkillStatus {
  return value === 'mastered' || value === 'learning' || value === 'planned';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

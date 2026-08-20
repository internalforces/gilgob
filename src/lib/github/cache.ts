import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  CONTRIBUTION_COLORS,
  type ContributionLevel,
  type ContributionWeek,
  type GitHubActivity,
  type GitHubStats,
} from './types';

export const DEFAULT_GITHUB_CACHE_PATH = resolve('.cache/github-stats.json');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isIsoDate(value: unknown, dateOnly = false): value is string {
  if (typeof value !== 'string') return false;
  if (dateOnly) return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
  return !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

function isSafeGitHubUrl(value: unknown, repository: string): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    const repositoryPath = `/${repository}`;
    return url.protocol === 'https:'
      && url.hostname === 'github.com'
      && url.port === ''
      && url.username === ''
      && url.password === ''
      && url.search === ''
      && url.hash === ''
      && (url.pathname === repositoryPath || url.pathname.startsWith(`${repositoryPath}/`))
      && url.pathname.split('/').filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

function isContributionDay(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ['date', 'count', 'level', 'color'])) return false;
  if (!isIsoDate(value.date, true) || !Number.isInteger(value.count) || (value.count as number) < 0) return false;
  if (!Number.isInteger(value.level) || (value.level as number) < 0 || (value.level as number) > 4) return false;
  const count = value.count as number;
  const level = value.level as ContributionLevel;
  const expectedLevel: ContributionLevel = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 7 ? 3 : 4;
  return level === expectedLevel && value.color === CONTRIBUTION_COLORS[level];
}

function isContributionWeek(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['days'])
    && Array.isArray(value.days)
    && value.days.length <= 7
    && value.days.every(isContributionDay);
}

function isGitHubActivity(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['id', 'repository', 'label', 'url', 'createdAt'])
    && typeof value.id === 'string'
    && value.id.length > 0
    && value.id.length <= 128
    && typeof value.repository === 'string'
    && /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/.test(value.repository)
    && typeof value.label === 'string'
    && value.label.length > 0
    && value.label.length <= 100
    && isSafeGitHubUrl(value.url, value.repository)
    && isIsoDate(value.createdAt);
}

const CANONICAL_ACTIVITY_LABELS = new Set([
  '커밋을 푸시했습니다',
  '풀 리퀘스트를 병합했습니다',
  '풀 리퀘스트를 닫았습니다',
  '풀 리퀘스트를 열었습니다',
  '풀 리퀘스트를 업데이트했습니다',
  '이슈를 닫았습니다',
  '이슈를 열었습니다',
  '이슈를 업데이트했습니다',
  '브랜치를 만들었습니다',
  '태그를 만들었습니다',
  '저장소를 만들었습니다',
  '릴리스를 게시했습니다',
]);

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`);
}

function weekStart(value: string): number {
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.getTime() - date.getUTCDay() * DAY_MS;
}

function hasCoherentContributions(total: number, weeks: ContributionWeek[]): boolean {
  const dates = new Set<string>();
  let previousDate = '';
  let previousDayTimestamp: number | null = null;
  let previousWeekStart: number | null = null;
  let calculatedTotal = 0;

  for (const week of weeks) {
    if (week.days.length === 0) return false;
    const currentWeekStart = weekStart(week.days[0]!.date);
    if (previousWeekStart !== null && currentWeekStart - previousWeekStart !== 7 * DAY_MS) return false;

    for (const day of week.days) {
      const dayTimestamp = utcDay(day.date);
      if (weekStart(day.date) !== currentWeekStart
        || dates.has(day.date)
        || (previousDate !== '' && day.date <= previousDate)
        || (previousDayTimestamp !== null && dayTimestamp - previousDayTimestamp !== DAY_MS)) return false;
      dates.add(day.date);
      previousDate = day.date;
      previousDayTimestamp = dayTimestamp;
      calculatedTotal += day.count;
    }
    previousWeekStart = currentWeekStart;
  }

  if (calculatedTotal !== total) return false;
  if (dates.size > 365) return false;
  if (dates.size > 1) {
    const orderedDates = [...dates];
    if (utcDay(orderedDates.at(-1)!) - utcDay(orderedDates[0]!) > 364 * DAY_MS) return false;
  }
  return true;
}

function isCanonicalActivityLabel(label: string): boolean {
  return CANONICAL_ACTIVITY_LABELS.has(label) || /^커밋 [1-9]\d*개를 푸시했습니다$/.test(label);
}

function hasCoherentEvents(events: GitHubActivity[]): boolean {
  const ids = new Set<string>();
  let previous: GitHubActivity | null = null;
  for (const event of events) {
    if (ids.has(event.id) || !isCanonicalActivityLabel(event.label)) return false;
    if (previous
      && (event.createdAt > previous.createdAt
        || (event.createdAt === previous.createdAt && event.id < previous.id))) return false;
    ids.add(event.id);
    previous = event;
  }
  return true;
}

export function isGitHubStats(value: unknown): value is GitHubStats {
  if (!(isRecord(value)
    && hasExactKeys(value, ['total', 'weeks', 'events', 'fetchedAt', 'stale'])
    && Number.isInteger(value.total)
    && (value.total as number) >= 0
    && Array.isArray(value.weeks)
    && value.weeks.length <= 54
    && value.weeks.every(isContributionWeek)
    && Array.isArray(value.events)
    && value.events.length <= 6
    && value.events.every(isGitHubActivity)
    && isIsoDate(value.fetchedAt)
    && typeof value.stale === 'boolean')) return false;

  const stats = value as unknown as GitHubStats;
  return hasCoherentContributions(stats.total, stats.weeks) && hasCoherentEvents(stats.events);
}

export async function readGitHubCache(path = DEFAULT_GITHUB_CACHE_PATH): Promise<GitHubStats | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
    return isGitHubStats(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeGitHubCache(
  stats: GitHubStats,
  path = DEFAULT_GITHUB_CACHE_PATH,
): Promise<void> {
  if (!isGitHubStats(stats)) throw new TypeError('GitHub 캐시 형식이 올바르지 않습니다.');

  const directory = dirname(path);
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporaryPath, `${JSON.stringify(stats)}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

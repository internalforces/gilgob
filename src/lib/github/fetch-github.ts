import { readGitHubCache, writeGitHubCache } from './cache';
import {
  CONTRIBUTION_COLORS,
  GITHUB_USERNAME,
  type ContributionDay,
  type ContributionLevel,
  type ContributionWeek,
  type GitHubActivity,
  type GitHubStats,
} from './types';

const GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const EVENTS_ENDPOINT = `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=30`;
const FRESH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_RECENT_EVENTS = 6;
const ALLOWED_EVENT_TYPES = new Set([
  'PushEvent',
  'PullRequestEvent',
  'IssuesEvent',
  'CreateEvent',
  'ReleaseEvent',
]);

export const GITHUB_API_VERSION = '2026-03-10';

const CONTRIBUTIONS_QUERY = `
  query GitHubContributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;

interface ContributionData {
  total: number;
  weeks: ContributionWeek[];
}

type GitHubRequest = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface GetGitHubStatsOptions {
  token?: string;
  now?: () => Date;
  request?: GitHubRequest;
  readCache?: () => Promise<GitHubStats | null>;
  writeCache?: (stats: GitHubStats) => Promise<void>;
  warn?: (message: string) => void;
  cacheTtlMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateOnly(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
}

function countToLevel(count: number): ContributionLevel {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 7) return 3;
  return 4;
}

export function normalizeContributionCalendar(payload: unknown): ContributionData {
  if (!isRecord(payload)) throw new TypeError('GraphQL 응답 형식이 올바르지 않습니다.');
  if ('errors' in payload) {
    if (!Array.isArray(payload.errors) || payload.errors.length > 0) {
      throw new TypeError('GraphQL 응답에 오류가 있습니다.');
    }
  }

  const data = payload.data;
  if (!isRecord(data) || !isRecord(data.user)) throw new TypeError('GitHub 사용자를 찾을 수 없습니다.');
  const collection = data.user.contributionsCollection;
  if (!isRecord(collection) || !isRecord(collection.contributionCalendar)) {
    throw new TypeError('기여 캘린더 응답 형식이 올바르지 않습니다.');
  }

  const calendar = collection.contributionCalendar;
  if (!Number.isInteger(calendar.totalContributions) || (calendar.totalContributions as number) < 0) {
    throw new TypeError('기여 합계가 올바르지 않습니다.');
  }
  if (!Array.isArray(calendar.weeks) || calendar.weeks.length > 54) {
    throw new TypeError('기여 주차가 올바르지 않습니다.');
  }

  const seenDates = new Set<string>();
  const weeks = calendar.weeks.map((rawWeek): ContributionWeek => {
    if (!isRecord(rawWeek) || !Array.isArray(rawWeek.contributionDays) || rawWeek.contributionDays.length > 7) {
      throw new TypeError('기여 일자가 올바르지 않습니다.');
    }

    const days = rawWeek.contributionDays.map((rawDay): ContributionDay => {
      if (!isRecord(rawDay)
        || !isDateOnly(rawDay.date)
        || !Number.isInteger(rawDay.contributionCount)
        || (rawDay.contributionCount as number) < 0
        || seenDates.has(rawDay.date)) {
        throw new TypeError('기여 일자 값이 올바르지 않습니다.');
      }
      seenDates.add(rawDay.date);
      const count = rawDay.contributionCount as number;
      const level = countToLevel(count);
      return { date: rawDay.date, count, level, color: CONTRIBUTION_COLORS[level] };
    });

    days.sort((left, right) => left.date.localeCompare(right.date));
    return { days };
  });

  weeks.sort((left, right) => (left.days[0]?.date ?? '').localeCompare(right.days[0]?.date ?? ''));
  return { total: calendar.totalContributions as number, weeks };
}

function validRepository(value: unknown): value is string {
  if (typeof value !== 'string'
    || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/.test(value)) return false;
  const [, repository = ''] = value.split('/');
  return repository !== '.' && repository !== '..' && !repository.includes('..');
}

function validDateTime(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function constructedGitHubUrl(repository: string, suffix = ''): string {
  const [owner, name] = repository.split('/');
  return `https://github.com/${encodeURIComponent(owner!)}/${encodeURIComponent(name!)}${suffix}`;
}

function safeGitHubUrl(value: unknown, repository: string, fallbackSuffix = ''): string {
  const fallback = constructedGitHubUrl(repository, fallbackSuffix);
  if (typeof value !== 'string') return fallback;
  try {
    const url = new URL(value);
    const repositoryPath = `/${repository}`;
    if (url.protocol !== 'https:'
      || url.hostname !== 'github.com'
      || url.port !== ''
      || url.username !== ''
      || url.password !== ''
      || (url.pathname !== repositoryPath && !url.pathname.startsWith(`${repositoryPath}/`))) return fallback;
    return `${url.origin}${url.pathname}`;
  } catch {
    return fallback;
  }
}

function normalizeEvent(value: unknown): GitHubActivity | null {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || value.id.length === 0
    || value.id.length > 128
    || value.public !== true
    || !validDateTime(value.created_at)
    || !isRecord(value.repo)
    || !validRepository(value.repo.name)
    || !isRecord(value.payload)) return null;

  const id = value.id;
  const repository = value.repo.name;
  const payload = value.payload;
  const createdAt = new Date(value.created_at).toISOString();
  let label: string;
  let url: string;

  switch (value.type) {
    case 'PushEvent': {
      const size = positiveInteger(payload.size) ? payload.size : null;
      label = size ? `커밋 ${size}개를 푸시했습니다` : '커밋을 푸시했습니다';
      const suffix = typeof payload.head === 'string' && /^[a-f0-9]{40,64}$/i.test(payload.head)
        ? `/commit/${payload.head}`
        : '';
      url = constructedGitHubUrl(repository, suffix);
      break;
    }
    case 'PullRequestEvent': {
      const pullRequest = isRecord(payload.pull_request) ? payload.pull_request : null;
      const merged = pullRequest?.merged === true;
      label = merged
        ? '풀 리퀘스트를 병합했습니다'
        : payload.action === 'closed'
          ? '풀 리퀘스트를 닫았습니다'
          : payload.action === 'opened' || payload.action === 'reopened'
            ? '풀 리퀘스트를 열었습니다'
            : '풀 리퀘스트를 업데이트했습니다';
      const number = positiveInteger(payload.number) ? payload.number : null;
      url = safeGitHubUrl(pullRequest?.html_url, repository, number ? `/pull/${number}` : '/pulls');
      break;
    }
    case 'IssuesEvent': {
      const issue = isRecord(payload.issue) ? payload.issue : null;
      label = payload.action === 'closed'
        ? '이슈를 닫았습니다'
        : payload.action === 'opened' || payload.action === 'reopened'
          ? '이슈를 열었습니다'
          : '이슈를 업데이트했습니다';
      const number = positiveInteger(issue?.number) ? issue.number : null;
      url = safeGitHubUrl(issue?.html_url, repository, number ? `/issues/${number}` : '/issues');
      break;
    }
    case 'CreateEvent': {
      const ref = typeof payload.ref === 'string' && payload.ref.length <= 256 ? payload.ref : null;
      if (payload.ref_type === 'branch') {
        label = '브랜치를 만들었습니다';
        url = constructedGitHubUrl(repository, ref ? `/tree/${encodeURIComponent(ref)}` : '/branches');
      } else if (payload.ref_type === 'tag') {
        label = '태그를 만들었습니다';
        url = constructedGitHubUrl(repository, ref ? `/releases/tag/${encodeURIComponent(ref)}` : '/tags');
      } else {
        label = '저장소를 만들었습니다';
        url = constructedGitHubUrl(repository);
      }
      break;
    }
    case 'ReleaseEvent': {
      const release = isRecord(payload.release) ? payload.release : null;
      label = '릴리스를 게시했습니다';
      url = safeGitHubUrl(release?.html_url, repository, '/releases');
      break;
    }
    default:
      return null;
  }

  return { id, repository, label, url, createdAt };
}

export function normalizeEvents(payload: unknown): GitHubActivity[] {
  if (!Array.isArray(payload)) throw new TypeError('GitHub 이벤트 응답 형식이 올바르지 않습니다.');

  const normalized: GitHubActivity[] = [];
  for (const rawEvent of payload) {
    if (!isRecord(rawEvent) || typeof rawEvent.type !== 'string') {
      throw new TypeError('GitHub 이벤트 항목 형식이 올바르지 않습니다.');
    }
    if (!ALLOWED_EVENT_TYPES.has(rawEvent.type) || rawEvent.public !== true) continue;
    const event = normalizeEvent(rawEvent);
    if (!event) throw new TypeError('GitHub 이벤트 항목 형식이 올바르지 않습니다.');
    normalized.push(event);
  }
  normalized.sort((left, right) => (
    right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id)
  ));
  const seenIds = new Set<string>();
  return normalized.filter(({ id }) => {
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  }).slice(0, MAX_RECENT_EVENTS);
}

export function getContributionRange(now: Date): { from: string; to: string } {
  if (Number.isNaN(now.getTime())) throw new TypeError('기여 조회 기준 시간이 올바르지 않습니다.');
  const to = new Date(now);
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 364);
  from.setUTCHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function formatRelativeDate(createdAt: string, referenceTime: Date): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime()) || Number.isNaN(referenceTime.getTime())) {
    throw new TypeError('GitHub 활동 시간이 올바르지 않습니다.');
  }

  const elapsedSeconds = Math.max(0, Math.floor((referenceTime.getTime() - created.getTime()) / 1000));
  if (elapsedSeconds < 60) return '방금 전';
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}분 전`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}시간 전`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays <= 30) return `${elapsedDays}일 전`;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(created);
}

function isFresh(stats: GitHubStats, now: Date, ttl: number): boolean {
  const age = now.getTime() - Date.parse(stats.fetchedAt);
  return !stats.stale && age >= 0 && age <= ttl;
}

async function fetchJson(
  request: GitHubRequest,
  input: string,
  init: RequestInit,
): Promise<unknown> {
  const response = await request(input, init);
  if (!response.ok) throw new Error('GitHub API 요청이 실패했습니다.');
  return response.json() as Promise<unknown>;
}

export async function getGitHubStats(options: GetGitHubStatsOptions = {}): Promise<GitHubStats | null> {
  const now = options.now?.() ?? new Date();
  const readCache = options.readCache ?? readGitHubCache;
  const persistCache = options.writeCache ?? writeGitHubCache;
  const request = options.request ?? fetch;
  const warn = options.warn ?? console.warn;
  const ttl = options.cacheTtlMs ?? FRESH_CACHE_TTL_MS;
  let cached: GitHubStats | null = null;

  try {
    cached = await readCache();
  } catch {
    cached = null;
  }

  const token = options.token?.trim();
  if (!token) return cached ? { ...cached, stale: !isFresh(cached, now, ttl) } : null;
  if (cached && isFresh(cached, now, ttl)) return cached;

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  };
  const { from, to } = getContributionRange(now);
  const contributionPromise = fetchJson(request, GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { login: GITHUB_USERNAME, from, to },
    }),
  }).then(normalizeContributionCalendar);
  const eventsPromise = fetchJson(request, EVENTS_ENDPOINT, { method: 'GET', headers }).then(normalizeEvents);
  const [contributionResult, eventsResult] = await Promise.allSettled([contributionPromise, eventsPromise]);

  if (contributionResult.status === 'fulfilled' && eventsResult.status === 'fulfilled') {
    const stats: GitHubStats = {
      ...contributionResult.value,
      events: eventsResult.value,
      fetchedAt: now.toISOString(),
      stale: false,
    };
    try {
      await persistCache(stats);
    } catch {
      warn('[github] GitHub 활동 캐시를 저장하지 못했습니다.');
    }
    return stats;
  }

  warn('[github] GitHub 활동을 갱신하지 못해 이전 데이터를 사용합니다.');
  if (!cached) return null;

  return {
    total: contributionResult.status === 'fulfilled' ? contributionResult.value.total : cached.total,
    weeks: contributionResult.status === 'fulfilled' ? contributionResult.value.weeks : cached.weeks,
    events: eventsResult.status === 'fulfilled' ? eventsResult.value : cached.events,
    fetchedAt: cached.fetchedAt,
    stale: true,
  };
}

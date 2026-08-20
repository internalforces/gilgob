import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getContributionRange,
  getGitHubStats,
  formatRelativeDate,
  normalizeContributionCalendar,
  normalizeEvents,
} from '../../src/lib/github/fetch-github';
import {
  isGitHubStats,
  readGitHubCache,
  writeGitHubCache,
} from '../../src/lib/github/cache';
import type { GitHubStats } from '../../src/lib/github/types';

const fixture = async (name: 'graphql' | 'events') => JSON.parse(
  await readFile(new URL(`../fixtures/github/${name}.json`, import.meta.url), 'utf8'),
) as unknown;

const now = new Date('2026-08-20T12:00:00.000Z');
const cached: GitHubStats = {
  total: 42,
  weeks: [{
    days: [{
      date: '2026-08-18',
      count: 2,
      level: 2,
      color: '#7dd3a7',
    }],
  }],
  events: [{
    id: 'cached-1',
    repository: 'internalforces/cache',
    label: '커밋을 푸시했습니다',
    url: 'https://github.com/internalforces/cache',
    createdAt: '2026-08-18T00:00:00.000Z',
  }],
  fetchedAt: '2026-08-19T00:00:00.000Z',
  stale: false,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GitHub payload normalization', () => {
  it('maps contribution counts to trusted levels and palette values', async () => {
    const result = normalizeContributionCalendar(await fixture('graphql'));

    expect(result).toEqual({
      total: 14,
      weeks: [
        { days: [
          { date: '2026-08-16', count: 0, level: 0, color: '#edf1f5' },
          { date: '2026-08-17', count: 1, level: 1, color: '#c9f0df' },
          { date: '2026-08-18', count: 4, level: 3, color: '#37c998' },
        ] },
        { days: [
          { date: '2026-08-19', count: 9, level: 4, color: '#167c61' },
        ] },
      ],
    });
  });

  it('rejects GraphQL errors, missing users, and malformed contribution days', () => {
    expect(() => normalizeContributionCalendar({ errors: [{ message: 'rate limit' }], data: null })).toThrow();
    expect(() => normalizeContributionCalendar({ data: { user: null } })).toThrow();
    expect(() => normalizeContributionCalendar({
      data: { user: { contributionsCollection: { contributionCalendar: {
        totalContributions: 1,
        weeks: [{ contributionDays: [{ date: '20-08-2026', contributionCount: -1 }] }],
      } } } },
    })).toThrow();
  });

  it('keeps five public event types, deduplicates, sorts, and creates only safe GitHub URLs', async () => {
    const result = normalizeEvents(await fixture('events'));

    expect(result.map(({ id, label, url }) => ({ id, label, url }))).toEqual([
      {
        id: 'push-1',
        label: '커밋 2개를 푸시했습니다',
        url: 'https://github.com/internalforces/gilgob/commit/7a8f3ac80e2ad2f6842cb86f576d4bfe2c03e300',
      },
      {
        id: 'pr-1',
        label: '풀 리퀘스트를 열었습니다',
        url: 'https://github.com/internalforces/atlas/pull/12',
      },
      {
        id: 'issue-1',
        label: '이슈를 닫았습니다',
        url: 'https://github.com/internalforces/signal/issues/7',
      },
      {
        id: 'create-1',
        label: '브랜치를 만들었습니다',
        url: 'https://github.com/internalforces/garden/tree/main',
      },
      {
        id: 'release-1',
        label: '릴리스를 게시했습니다',
        url: 'https://github.com/internalforces/tools/releases/tag/v1.0.0',
      },
    ]);
    expect(result.every(({ url }) => new URL(url).origin === 'https://github.com')).toBe(true);
  });

  it('drops private and unsupported events', () => {
    expect(normalizeEvents([
      { id: '1', type: 'PushEvent', public: false, created_at: '2026-08-20T00:00:00Z', repo: { name: 'internalforces/private' }, payload: {} },
      { id: '2', type: 'WatchEvent', public: true, created_at: '2026-08-20T00:00:00Z', repo: { name: 'internalforces/watch' }, payload: {} },
    ])).toEqual([]);
  });

  it('rejects malformed supported events instead of caching a false empty state', () => {
    expect(() => normalizeEvents([
      { id: '3', type: 'PushEvent', public: true, created_at: 'not-a-date', repo: { name: 'internalforces/bad' }, payload: {} },
    ])).toThrow();
    expect(() => normalizeEvents([
      { id: '4', type: 'PushEvent', public: true, created_at: '2026-08-20T00:00:00Z', repo: { name: '../escape' }, payload: {} },
    ])).toThrow();
  });
});

describe('GitHub activity dates', () => {
  it('formats relative dates from an explicit reference time', () => {
    expect(formatRelativeDate('2026-08-20T11:59:40.000Z', now)).toBe('방금 전');
    expect(formatRelativeDate('2026-08-20T11:55:00.000Z', now)).toBe('5분 전');
    expect(formatRelativeDate('2026-08-20T10:00:00.000Z', now)).toBe('2시간 전');
    expect(formatRelativeDate('2026-08-17T12:00:00.000Z', now)).toBe('3일 전');
    expect(formatRelativeDate('2026-07-01T12:00:00.000Z', now)).toBe('2026년 7월 1일');
  });
});

describe('GitHub request and fallback policy', () => {
  it('uses an inclusive 365-day UTC range across a year boundary', () => {
    expect(getContributionRange(new Date('2026-01-01T12:30:00Z'))).toEqual({
      from: '2025-01-02T00:00:00.000Z',
      to: '2026-01-01T23:59:59.999Z',
    });
  });

  it('sends the fixed account, bearer token, media type, and API version to both endpoints', async () => {
    const graphql = await fixture('graphql');
    const events = await fixture('events');
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const request = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      return new Response(JSON.stringify(url.endsWith('/graphql') ? graphql : events), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const result = await getGitHubStats({
      token: 'secret-test-token',
      now: () => now,
      request,
      readCache: async () => null,
      writeCache: async () => undefined,
      warn: vi.fn(),
    });

    expect(result?.total).toBe(14);
    expect(calls.map(({ url }) => url)).toEqual([
      'https://api.github.com/graphql',
      'https://api.github.com/users/internalforces/events/public?per_page=30',
    ]);
    for (const { init } of calls) {
      expect(new Headers(init?.headers)).toMatchObject(expect.any(Headers));
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer secret-test-token');
      expect(new Headers(init?.headers).get('accept')).toBe('application/vnd.github+json');
      expect(new Headers(init?.headers).get('x-github-api-version')).toBe('2026-03-10');
    }
    const graphqlBody = JSON.parse(String(calls[0]?.init?.body)) as { variables: Record<string, string>; query: string };
    expect(graphqlBody.variables).toEqual({
      login: 'internalforces',
      from: '2025-08-21T00:00:00.000Z',
      to: '2026-08-20T23:59:59.999Z',
    });
    expect(graphqlBody.query).toContain('contributionsCollection(from: $from, to: $to)');
  });

  it('returns a fresh cache without making a network request', async () => {
    const request = vi.fn();
    const result = await getGitHubStats({
      token: 'secret',
      now: () => new Date('2026-08-19T04:00:00.000Z'),
      request,
      readCache: async () => cached,
      writeCache: vi.fn(),
      warn: vi.fn(),
    });

    expect(result).toEqual(cached);
    expect(request).not.toHaveBeenCalled();
  });

  it('refreshes a cache explicitly marked stale even when its timestamp is recent', async () => {
    const graphql = await fixture('graphql');
    const events = await fixture('events');
    const request = vi.fn(async (input: string | URL | Request) => new Response(JSON.stringify(
      String(input).endsWith('/graphql') ? graphql : events,
    ), { status: 200 }));
    const result = await getGitHubStats({
      token: 'secret',
      now: () => new Date('2026-08-19T04:00:00.000Z'),
      request,
      readCache: async () => ({ ...cached, stale: true }),
      writeCache: async () => undefined,
      warn: vi.fn(),
    });

    expect(result).toMatchObject({ total: 14, stale: false });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('never requests the network without a token and marks an old cache stale', async () => {
    const request = vi.fn();
    const result = await getGitHubStats({
      token: '',
      now: () => now,
      request,
      readCache: async () => cached,
      writeCache: vi.fn(),
      warn: vi.fn(),
    });

    expect(result).toMatchObject({ total: 42, stale: true });
    expect(request).not.toHaveBeenCalled();
  });

  it('returns null without warning or network when token and cache are both absent', async () => {
    const request = vi.fn();
    const warn = vi.fn();
    const result = await getGitHubStats({
      token: undefined,
      now: () => now,
      request,
      readCache: async () => null,
      writeCache: vi.fn(),
      warn,
    });

    expect(result).toBeNull();
    expect(request).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('uses a stale cache and emits one sanitized warning when both requests fail', async () => {
    const warn = vi.fn();
    const result = await getGitHubStats({
      token: 'secret-value-never-log',
      now: () => now,
      request: vi.fn().mockRejectedValue(new Error('rate limit secret-value-never-log')),
      readCache: async () => cached,
      writeCache: vi.fn(),
      warn,
    });

    expect(result).toMatchObject({ total: 42, stale: true });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(warn.mock.calls)).not.toContain('secret-value-never-log');
  });

  it('merges a successful source with the stale half of the cache without overwriting it', async () => {
    const graphql = await fixture('graphql');
    const writeCache = vi.fn();
    const warn = vi.fn();
    const result = await getGitHubStats({
      token: 'secret',
      now: () => now,
      request: vi.fn(async (input: string | URL | Request) => (
        String(input).endsWith('/graphql')
          ? new Response(JSON.stringify(graphql), { status: 200 })
          : new Response(JSON.stringify({ message: 'rate limited' }), { status: 429 })
      )),
      readCache: async () => cached,
      writeCache,
      warn,
    });

    expect(result).toMatchObject({ total: 14, events: cached.events, stale: true });
    expect(writeCache).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('returns null and one warning on a partial failure without cache', async () => {
    const graphql = await fixture('graphql');
    const warn = vi.fn();
    const result = await getGitHubStats({
      token: 'secret',
      now: () => now,
      request: vi.fn(async (input: string | URL | Request) => (
        String(input).endsWith('/graphql')
          ? new Response(JSON.stringify(graphql), { status: 200 })
          : new Response('unavailable', { status: 503 })
      )),
      readCache: async () => null,
      writeCache: vi.fn(),
      warn,
    });

    expect(result).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('treats GraphQL 200 errors and malformed REST JSON as failures', async () => {
    const warn = vi.fn();
    const result = await getGitHubStats({
      token: 'secret',
      now: () => now,
      request: vi.fn(async (input: string | URL | Request) => (
        String(input).endsWith('/graphql')
          ? new Response(JSON.stringify({ errors: [{ message: 'API rate limit exceeded' }] }), { status: 200 })
          : new Response('{not-json', { status: 200 })
      )),
      readCache: async () => cached,
      writeCache: vi.fn(),
      warn,
    });

    expect(result).toMatchObject({ total: 42, stale: true });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('GitHub cache schema and persistence', () => {
  it('accepts only strict normalized stats with trusted colors and GitHub URLs', () => {
    expect(isGitHubStats(cached)).toBe(true);
    expect(isGitHubStats({ ...cached, token: 'must-not-persist' })).toBe(false);
    expect(isGitHubStats({ ...cached, weeks: [{ days: [{ ...cached.weeks[0]!.days[0]!, color: 'red' }] }] })).toBe(false);
    expect(isGitHubStats({ ...cached, events: [{ ...cached.events[0]!, url: 'javascript:alert(1)' }] })).toBe(false);
    expect(isGitHubStats({
      ...cached,
      events: [{ ...cached.events[0]!, url: 'https://github.com/internalforces/another-repository' }],
    })).toBe(false);
  });

  it('returns null for malformed JSON and schema-invalid cache files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-github-cache-'));
    const path = join(directory, 'stats.json');
    try {
      await writeFile(path, '{broken', 'utf8');
      expect(await readGitHubCache(path)).toBeNull();
      await writeFile(path, JSON.stringify({ ...cached, total: -1 }), 'utf8');
      expect(await readGitHubCache(path)).toBeNull();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('atomically writes parseable normalized cache data without temporary leftovers', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-github-cache-'));
    const path = join(directory, 'nested', 'stats.json');
    try {
      await writeGitHubCache(cached, path);
      expect(await readGitHubCache(path)).toEqual(cached);
      expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(cached);
      const { readdir } = await import('node:fs/promises');
      expect(await readdir(join(directory, 'nested'))).toEqual(['stats.json']);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

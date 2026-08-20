import { expect, it, vi } from 'vitest';
import {
  createPagefindLoader,
  createSearchGeneration,
  createSearchController,
  resolvePagefindUrl,
  SearchUnavailableError,
  type PagefindResult,
} from '../../src/lib/search/pagefind';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

function result(id: string): PagefindResult {
  return {
    url: `/knowledge/${id}/`,
    excerpt: `${id} 검색 문맥`,
    meta: { title: id, type: '지식', category: '데이터 구조' },
  };
}

it('loads Pagefind once and suppresses a stale query response', async () => {
  const first = deferred<{ results: Array<{ id: string; data(): Promise<PagefindResult> }> }>();
  const second = deferred<{ results: Array<{ id: string; data(): Promise<PagefindResult> }> }>();
  const search = vi.fn((term: string) => term === '데이터' ? first.promise : second.promise);
  const loader = vi.fn(async () => ({ search }));
  const controller = createSearchController(loader);

  const staleQuery = controller.query('데이터');
  const currentQuery = controller.query('데이터베이스');
  second.resolve({ results: [{ id: 'current', data: async () => result('current') }] });
  await expect(currentQuery).resolves.toEqual([result('current')]);
  first.resolve({ results: [{ id: 'stale', data: async () => result('stale') }] });

  await expect(staleQuery).resolves.toEqual([]);
  expect(loader).toHaveBeenCalledTimes(1);
  expect(controller.currentQuery()).toBe('데이터베이스');
});

it('does not load Pagefind for an empty or whitespace-only query', async () => {
  const loader = vi.fn();
  const controller = createSearchController(loader);

  await expect(controller.query('  ')).resolves.toEqual([]);

  expect(loader).not.toHaveBeenCalled();
  expect(controller.currentQuery()).toBe('  ');
});

it('keeps every Pagefind result inside the GitHub Pages base path', () => {
  const base = '/gilgob';

  expect(resolvePagefindUrl('/knowledge/database/b-tree-index/', base))
    .toBe('/gilgob/knowledge/database/b-tree-index/');
  expect(resolvePagefindUrl('/gilgob/projects/signal-hub/', base))
    .toBe('/gilgob/projects/signal-hub/');
});

it('treats the build sentinel as an unavailable search instead of importing Pagefind', async () => {
  const fetchStatus = vi.fn(async () => 200);
  const importModule = vi.fn();
  const load = createPagefindLoader('/garden', { fetchStatus, importModule });

  await expect(load()).rejects.toBeInstanceOf(SearchUnavailableError);
  expect(fetchStatus).toHaveBeenCalledWith('/garden/pagefind/unavailable.json');
  expect(importModule).not.toHaveBeenCalled();
});

it('imports Pagefind from the configured base path when no sentinel exists', async () => {
  const module = { search: vi.fn() };
  const importModule = vi.fn(async () => module);
  const load = createPagefindLoader('/garden/', {
    fetchStatus: vi.fn(async () => 404),
    importModule,
  });

  await expect(load()).resolves.toBe(module);
  expect(importModule).toHaveBeenCalledWith('/garden/pagefind/pagefind.js');
});

it('retries the Pagefind loader after a transient rejection', async () => {
  const search = vi.fn(async () => ({
    results: [{ id: 'recovered', data: async () => result('recovered') }],
  }));
  const loader = vi.fn()
    .mockRejectedValueOnce(new Error('일시적인 네트워크 오류'))
    .mockResolvedValueOnce({ search });
  const controller = createSearchController(loader);

  await expect(controller.query('첫 시도')).rejects.toThrow('일시적인 네트워크 오류');
  await expect(controller.query('다시 시도')).resolves.toEqual([result('recovered')]);

  expect(loader).toHaveBeenCalledTimes(2);
});

it('invalidates a pending request when input is cleared', () => {
  const generation = createSearchGeneration();
  const pending = generation.invalidate();

  generation.invalidate();

  expect(generation.isCurrent(pending)).toBe(false);
});

it('invalidates a pending request as soon as the next value enters debounce', () => {
  const generation = createSearchGeneration();
  const pending = generation.invalidate();

  const waiting = generation.invalidate();

  expect(generation.isCurrent(pending)).toBe(false);
  expect(generation.isCurrent(waiting)).toBe(true);
});

it('distinguishes repeated query text by generation rather than value', () => {
  const generation = createSearchGeneration();
  const firstA = generation.invalidate();
  generation.invalidate();
  const latestA = generation.invalidate();

  expect(generation.isCurrent(firstA)).toBe(false);
  expect(generation.isCurrent(latestA)).toBe(true);
});

it('invalidates a pending request when composition starts', () => {
  const generation = createSearchGeneration();
  const pending = generation.invalidate();

  generation.invalidate();

  expect(generation.isCurrent(pending)).toBe(false);
});

export interface PagefindResult {
  url: string;
  excerpt: string;
  plain_excerpt?: string;
  meta: Record<string, string>;
}

export interface PagefindSearchResult {
  id: string;
  data(): Promise<PagefindResult>;
}

export interface SearchModule {
  search(query: string): Promise<{ results: PagefindSearchResult[] }>;
}

export interface SearchController {
  query(value: string): Promise<PagefindResult[]>;
  currentQuery(): string;
}

export type SearchModuleLoader = () => Promise<SearchModule>;

interface PagefindLoaderDependencies {
  fetchStatus(url: string): Promise<number>;
  importModule(url: string): Promise<SearchModule>;
}

export class SearchUnavailableError extends Error {
  constructor() {
    super('검색 인덱스를 사용할 수 없습니다.');
    this.name = 'SearchUnavailableError';
  }
}

function normalizeBase(base: string): string {
  if (!base || base === '/') return '';
  return `/${base}`.replace(/\/+/g, '/').replace(/\/$/, '');
}

const browserDependencies: PagefindLoaderDependencies = {
  async fetchStatus(url) {
    try {
      return (await fetch(url, { cache: 'no-store' })).status;
    } catch {
      return 0;
    }
  },
  async importModule(url) {
    return import(/* @vite-ignore */ url) as Promise<SearchModule>;
  },
};

export function createPagefindLoader(
  base: string,
  dependencies: PagefindLoaderDependencies = browserDependencies,
): SearchModuleLoader {
  const bundlePath = `${normalizeBase(base)}/pagefind`;

  return async () => {
    const unavailableStatus = await dependencies.fetchStatus(`${bundlePath}/unavailable.json`);
    if (unavailableStatus === 200) throw new SearchUnavailableError();

    return dependencies.importModule(`${bundlePath}/pagefind.js`);
  };
}

export function resolvePagefindUrl(url: string, base: string): string {
  if (/^(?:https?:)?\/\//.test(url) || url.startsWith('#')) return url;

  const normalizedBase = normalizeBase(base);
  const normalizedUrl = `/${url}`.replace(/\/+/g, '/');

  return normalizedBase && normalizedUrl.startsWith(`${normalizedBase}/`)
    ? normalizedUrl
    : `${normalizedBase}${normalizedUrl}`;
}

export function createSearchController(loader: SearchModuleLoader): SearchController {
  let modulePromise: Promise<SearchModule> | undefined;
  let latestQuery = '';
  let requestSequence = 0;

  return {
    async query(value) {
      latestQuery = value;
      const sequence = ++requestSequence;
      const query = value.trim();

      if (!query) return [];

      modulePromise ??= loader();
      const pagefind = await modulePromise;
      const response = await pagefind.search(query);
      const results = await Promise.all(response.results.map((entry) => entry.data()));

      return sequence === requestSequence ? results : [];
    },
    currentQuery() {
      return latestQuery;
    },
  };
}

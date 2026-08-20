/** @jsxImportSource preact */
import { useEffect, useId, useMemo, useState } from 'preact/hooks';

export interface FilterEntry {
  id: string;
  kind: 'knowledge' | 'explorations' | 'projects' | 'logs';
  title: string;
  description: string;
  category: string;
  tags: string[];
  status?: string;
}

interface Props {
  entries: FilterEntry[];
  initialSearchParams: string;
}

interface Filters {
  q: string;
  type: string;
  category: string;
  tag: string;
  status: string;
}

const typeLabels: Record<string, string> = {
  knowledge: '지식',
  explorations: '탐구',
  projects: '프로젝트',
  logs: '학습 기록',
};
const statusLabels: Record<string, string> = {
  seed: '씨앗', growing: '성장 중', mastered: '숙련',
  active: '탐구 중', paused: '잠시 멈춤', complete: '완료',
  idea: '아이디어', building: '구축 중', maintained: '유지 중', archived: '보관',
};

export default function ContentFilters({ entries, initialSearchParams }: Props) {
  const [filters, setFilters] = useState(() => readFilters(new URLSearchParams(initialSearchParams)));
  const [hydrated, setHydrated] = useState(false);
  const searchId = useId();
  const categoryId = useId();
  const tagId = useId();
  const typeId = useId();
  const statusId = useId();
  const options = useMemo(() => ({
    types: unique(entries.map(({ kind }) => kind)),
    categories: unique(entries.map(({ category }) => category)),
    tags: unique(entries.flatMap(({ tags }) => tags)),
    statuses: unique(entries.flatMap(({ status }) => status ? [status] : [])),
  }), [entries]);
  const visibleIds = useMemo(() => new Set(entries.filter((entry) => matches(entry, filters)).map(({ id }) => id)), [entries, filters]);

  useEffect(() => {
    setFilters(readFilters(new URLSearchParams(window.location.search)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    document.querySelectorAll<HTMLElement>('[data-filter-card]').forEach((card) => {
      card.hidden = !visibleIds.has(card.dataset.entryId ?? '');
    });

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, [filters, hydrated, visibleIds]);

  const update = (key: keyof Filters) => (event: Event) => {
    const value = (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <section class="content-filters" aria-label="콘텐츠 필터">
      <div class="content-filters__search">
        <label for={searchId}>목록 검색</label>
        <input id={searchId} type="search" name="q" value={filters.q} onInput={update('q')} placeholder="제목, 설명, 태그 검색" />
      </div>
      <div class="content-filters__selects">
        <FilterSelect id={typeId} name="type" label="유형" value={filters.type} options={options.types} labels={typeLabels} onChange={update('type')} />
        <FilterSelect id={categoryId} name="category" label="분야" value={filters.category} options={options.categories} onChange={update('category')} />
        <FilterSelect id={tagId} name="tag" label="태그" value={filters.tag} options={options.tags} onChange={update('tag')} />
        <FilterSelect id={statusId} name="status" label="상태" value={filters.status} options={options.statuses} labels={statusLabels} onChange={update('status')} />
      </div>
      <p class="content-filters__count" aria-live="polite">전체 {entries.length}개 중 {visibleIds.size}개</p>
    </section>
  );
}

interface FilterSelectProps {
  id: string;
  name: keyof Filters;
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (event: Event) => void;
}

function FilterSelect({ id, name, label, value, options, labels, onChange }: FilterSelectProps) {
  return (
    <label for={id}>
      <span>{label}</span>
      <select id={id} name={name} value={value} onChange={onChange}>
        <option value="">전체</option>
        {options.map((option) => <option value={option}>{labels?.[option] ?? option}</option>)}
      </select>
    </label>
  );
}

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    category: params.get('category') ?? '',
    tag: params.get('tag') ?? '',
    status: params.get('status') ?? '',
  };
}

function matches(entry: FilterEntry, filters: Filters): boolean {
  const haystack = [entry.title, entry.description, entry.category, ...entry.tags].join(' ').normalize('NFC').toLocaleLowerCase('ko-KR');
  const query = filters.q.trim().normalize('NFC').toLocaleLowerCase('ko-KR');

  return (!query || haystack.includes(query))
    && (!filters.type || entry.kind === filters.type)
    && (!filters.category || entry.category === filters.category)
    && (!filters.tag || entry.tags.includes(filters.tag))
    && (!filters.status || entry.status === filters.status);
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'ko'));
}

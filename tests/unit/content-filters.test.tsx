import { h } from 'preact';
import render from 'preact-render-to-string';
import { describe, expect, it } from 'vitest';
import ContentFilters, {
  filtersToSearchParams,
  normalizeFilters,
  type FilterEntry,
} from '../../src/components/content/ContentFilters';

const entries: FilterEntry[] = [{
  id: 'knowledge/b-tree',
  kind: 'knowledge',
  title: 'B-Tree',
  description: '인덱스 구조',
  category: 'Computer Science',
  tags: ['Index'],
  status: 'mastered',
}];

describe('content filter hydration', () => {
  it('normalizes unavailable URL options to the empty filter', () => {
    const filters = normalizeFilters(entries, new URLSearchParams(
      'q=B-Tree&type=projects&category=AI&tag=LLM&status=active',
    ));

    expect(filters).toEqual({
      q: 'B-Tree',
      type: '',
      category: '',
      tag: '',
      status: '',
    });
    expect(filtersToSearchParams(filters).toString()).toBe('q=B-Tree');
  });

  it('renders all matching cards when hydration receives unavailable options', () => {
    const html = render(h(ContentFilters, {
      entries,
      initialSearchParams: '?type=projects&category=AI&tag=LLM&status=active',
    }));

    expect(html).toContain('전체 1개 중 1개');
    expect(html).toMatch(/<option selected value(?:="")?>전체<\/option>/);
  });
});

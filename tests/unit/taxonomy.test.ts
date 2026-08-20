import { describe, expect, it } from 'vitest';
import { categoryLabel } from '../../src/lib/content/taxonomy';

describe('categoryLabel', () => {
  it.each([
    ['Computer Science', '컴퓨터 과학'],
    ['Data & Mathematics', '데이터와 수학'],
    ['AI', '인공지능'],
    ['Finance', '금융'],
    ['Research', '리서치'],
    ['Projects', '프로젝트'],
    ['Learning', '학습'],
  ])('maps canonical category %s to Korean UI copy', (category, expected) => {
    expect(categoryLabel(category)).toBe(expected);
  });

  it('uses generic Korean copy for unknown or absent categories', () => {
    expect(categoryLabel('New Domain')).toBe('기타 분야');
    expect(categoryLabel(undefined)).toBe('기타 분야');
  });
});

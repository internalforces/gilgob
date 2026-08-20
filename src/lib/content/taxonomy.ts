export const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  'Computer Science': '컴퓨터 과학',
  'Data & Mathematics': '데이터와 수학',
  AI: '인공지능',
  Finance: '금융',
  Research: '리서치',
  Projects: '프로젝트',
  Learning: '학습',
};

export function categoryLabel(category: string | null | undefined): string {
  if (category === null || category === undefined || category === '') return '기타 분야';
  return CATEGORY_LABELS[category] ?? '기타 분야';
}

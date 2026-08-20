import rss from '@astrojs/rss';
import { SITE_CONFIG, withBase } from '../config/site';
import { getPublicEntries } from '../lib/content/queries';

const TYPE_LABELS = {
  knowledge: '지식',
  explorations: '탐구',
  projects: '프로젝트',
  logs: '학습 기록',
} as const;

function absoluteEntryUrl(path: string): string {
  const trailingPath = path.endsWith('/') ? path : `${path}/`;
  return new URL(withBase(trailingPath), SITE_CONFIG.site).href;
}

export async function GET() {
  const entries = await getPublicEntries();

  return rss({
    title: `${SITE_CONFIG.name} · 전체 지식 피드`,
    description: 'internalforces가 연결하고 축적하는 지식, 탐구, 프로젝트와 학습 기록입니다.',
    site: new URL(withBase('/'), SITE_CONFIG.site),
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.updated ?? entry.data.created,
      link: absoluteEntryUrl(entry.url),
      categories: [TYPE_LABELS[entry.kind], entry.data.category, ...entry.data.tags],
    })),
    customData: `<language>${SITE_CONFIG.locale}</language>`,
  });
}

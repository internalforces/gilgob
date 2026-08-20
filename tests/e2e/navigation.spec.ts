import { expect, test } from '@playwright/test';
import { pagePath } from './helpers';

const navigation = [
  ['홈', '/'],
  ['지식', '/knowledge/'],
  ['탐구', '/explorations/'],
  ['프로젝트', '/projects/'],
  ['학습 기록', '/logs/'],
  ['스킬 트리', '/skills/'],
  ['지식 그래프', '/graph/'],
] as const;

test('exposes every Korean global route and identifies the current location', async ({ page }) => {
  await page.goto(pagePath('/projects/'), { waitUntil: 'networkidle' });
  const navigationRegion = page.getByRole('navigation', { name: '주요 메뉴' });

  for (const [label, path] of navigation) {
    await expect(navigationRegion.getByRole('link', { name: label, exact: true }))
      .toHaveAttribute('href', pagePath(path));
  }
  await expect(navigationRegion.getByRole('link', { name: '프로젝트', exact: true }))
    .toHaveAttribute('aria-current', 'page');
});

test('moves keyboard focus from the skip link to the main content', async ({ page }) => {
  await page.goto(pagePath('/'));
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('serves the Korean 404 page and base-aware discovery files', async ({ page, request }) => {
  await page.goto(pagePath('/missing-page/'));
  await expect(page.getByRole('heading', { level: 1, name: '페이지를 찾을 수 없습니다.' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

  const robots = await request.get(pagePath('/robots.txt'));
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain(pagePath('/sitemap-index.xml'));

  const rss = await request.get(pagePath('/rss.xml'));
  expect(rss.ok()).toBe(true);
  expect(rss.headers()['content-type']).toContain('xml');
  const feed = await rss.text();
  expect(feed).toContain(`<link>https://internalforces.github.io${pagePath('/')}</link>`);
  expect(feed).toContain('B-Tree는 왜 DB Index에 사용될까?');
});

test('publishes absolute canonical and default Open Graph metadata', async ({ page }) => {
  await page.goto(pagePath('/knowledge/database/b-tree-index/'));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://internalforces.github.io${pagePath('/knowledge/database/b-tree-index/')}`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `https://internalforces.github.io${pagePath('/knowledge/database/b-tree-index/')}`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `https://internalforces.github.io${pagePath('/og-default.svg')}`,
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', pagePath('/favicon.svg'));
});

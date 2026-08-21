import { expect, test } from '@playwright/test';
import { pagePath } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile menu closes with Escape and restores trigger focus', async ({ page }) => {
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  const trigger = page.getByRole('button', { name: '모바일 메뉴 열기' });
  await trigger.click();
  await expect(page.getByRole('navigation', { name: '모바일 주요 메뉴' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: '모바일 주요 메뉴' })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('reading page keeps its mobile table of contents collapsed by default', async ({ page }) => {
  await page.goto(pagePath('/knowledge/database/b-tree-index/'), { waitUntil: 'networkidle' });
  const tableOfContents = page.locator('details.reading-toc--mobile');
  await expect(tableOfContents).toBeVisible();
  await expect(tableOfContents).not.toHaveAttribute('open', '');
  await expect(tableOfContents.getByText('목차', { exact: true })).toBeVisible();
});

for (const path of ['/', '/knowledge/', '/skills/', '/graph/', '/portfolio/8c5e1a7d3b92-signal-hub/']) {
  test(`${path} has no horizontal overflow on mobile`, async ({ page }) => {
    await page.goto(pagePath(path), { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    ))).toBe(true);
  });
}

test('graph retains the text fallback on mobile', async ({ page }) => {
  await page.goto(pagePath('/graph/'), { waitUntil: 'networkidle' });
  await expect(page.getByRole('group', { name: '그래프 대신 목록 보기' })).toBeVisible();
});

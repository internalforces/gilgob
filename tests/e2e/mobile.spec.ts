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

test('mobile menu closes from its backdrop and restores trigger focus', async ({ page }) => {
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  const trigger = page.getByRole('button', { name: '모바일 메뉴 열기' });
  await trigger.click();
  await page.locator('.mobile-menu__backdrop').click({ position: { x: 4, y: 4 } });
  await expect(page.getByRole('navigation', { name: '모바일 주요 메뉴' })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('mobile menu contains keyboard focus and locks background scrolling', async ({ page }) => {
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '모바일 메뉴 열기' }).click();

  await expect(page.locator('body')).toHaveClass(/menu-open/);
  const dialog = page.getByRole('dialog', { name: '모바일 메뉴' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '모바일 메뉴 닫기' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'GitHub 프로필 열기' })).toBeFocused();
});

test('mobile home puts its title and primary search in the first viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });

  const title = await page.getByRole('heading', { level: 1 }).boundingBox();
  const search = await page.getByRole('button', { name: '통합 검색 열기' }).boundingBox();
  expect(title).not.toBeNull();
  expect(search).not.toBeNull();
  expect(title!.y).toBeLessThan(220);
  expect(search!.y + search!.height).toBeLessThanOrEqual(640);
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

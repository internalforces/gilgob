import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { pagePath } from './helpers';

const skillsUrl = pagePath('/skills/');

test('renders the linked skill hierarchy with semantic progress', async ({ page }) => {
  await page.goto(skillsUrl, { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { level: 1, name: '배움의 지도를 펼칩니다.' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: '전체 스킬 진척도' })).toHaveAttribute('aria-valuenow', '50');
  await expect(page.getByRole('progressbar', { name: '컴퓨터 과학 분야 진척도' })).toBeAttached();

  const rootList = page.locator('.skill-tree__root');
  await expect(rootList).toHaveJSProperty('tagName', 'UL');
  await expect(rootList.locator('ul')).not.toHaveCount(0);

  const related = page.getByRole('link', { name: 'B-Tree는 왜 DB Index에 사용될까?' }).first();
  await expect(related).toHaveAttribute(
    'href',
    pagePath('/knowledge/database/b-tree-index'),
  );
});

test('field disclosure works from the keyboard and keeps trigger focus', async ({ page }) => {
  await page.goto(skillsUrl, { waitUntil: 'networkidle' });
  const disclosure = page.getByRole('button', { name: /컴퓨터 과학 분야/ });

  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(disclosure).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`has no automatically detectable accessibility violations on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(skillsUrl, { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { pagePath } from './helpers';

test.skip(
  process.env.GITHUB_EXPECT_STATE !== 'empty',
  '캐시와 토큰이 없는 명시적 GitHub empty 빌드에서만 실행합니다.',
);

test('no-token and no-cache build keeps the deterministic GitHub empty state', async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(pagePath('/'), { waitUntil: 'networkidle' });

    const section = page.locator('[data-github-activity]');
    await expect(section).toHaveAttribute('data-state', 'empty');
    await expect(section.getByRole('status')).toHaveText('GitHub 통계를 불러오지 못했습니다.');
    await expect(section.locator('.github-activity__grid')).toHaveCount(0);
    const results = await new AxeBuilder({ page }).include('[data-github-activity]').analyze();
    expect(results.violations).toEqual([]);
  }
});

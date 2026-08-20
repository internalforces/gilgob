import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const homeUrl = process.env.PLAYWRIGHT_TEST_BASE_URL
  ?? 'http://127.0.0.1:4321/astro-astro-personal-knowledge-base-digital/';
const expectedState = process.env.GITHUB_EXPECT_STATE ?? 'ready';

test.skip(!process.env.GITHUB_EXPECT_STATE, 'GitHub 캐시 fixture 상태를 명시한 검증에서만 실행합니다.');

test('fixture GitHub activity remains safe and accessible on desktop and mobile', async ({ page }) => {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1280, height: 900 },
    mobile: { width: 390, height: 844 },
  })) {
    await page.setViewportSize(viewport);
    await page.goto(homeUrl, { waitUntil: 'networkidle' });
    const section = page.locator('[data-github-activity]');
    await expect(section).toHaveAttribute('data-state', expectedState);
    await expect(section.getByRole('group', { name: /지난 1년 GitHub 기여 합계/ })).toBeAttached();
    await expect(section.getByRole('img', { name: /2026년 8월 20일, 기여 2회/ })).toBeAttached();
    await expect(section.getByRole('table', { name: '날짜별 GitHub 기여 횟수', includeHidden: true })).toBeAttached();
    await expect(section.getByText('커밋 2개를 푸시했습니다')).toBeVisible();
    const eventUrls = await section.locator('.recent-activity a').evaluateAll((links) => (
      links.map((link) => (link as HTMLAnchorElement).href)
    ));
    expect(eventUrls.every((url) => new URL(url).origin === 'https://github.com')).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).include('[data-github-activity]').analyze();
    expect(results.violations).toEqual([]);
    await section.screenshot({ path: `/tmp/gilgob-github-${expectedState}-${name}.png` });
  }
});

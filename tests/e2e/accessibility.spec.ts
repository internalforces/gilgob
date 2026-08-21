import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { pagePath } from './helpers';

for (const path of ['/', '/knowledge/', '/skills/', '/graph/', '/portfolio/8c5e1a7d3b92-signal-hub/']) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(pagePath(path), { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => (
      ['serious', 'critical'].includes(item.impact ?? '')
    ))).toEqual([]);
  });
}

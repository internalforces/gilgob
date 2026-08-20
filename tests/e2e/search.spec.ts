import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { pagePath } from './helpers';

async function mockSequencedPagefind(page: Page, delays: number[]) {
  await page.route('**/pagefind/pagefind.js', (route) => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: `
      const delays = ${JSON.stringify(delays)};
      window.__pagefindSearchCalls = [];
      export async function search(query) {
        const call = window.__pagefindSearchCalls.length;
        window.__pagefindSearchCalls.push(query);
        await new Promise((resolve) => setTimeout(resolve, delays[call] ?? 10));
        const prefix = call === 0 ? '오래된' : '최신';
        return {
          results: [{
            id: String(call),
            async data() {
              return {
                url: '/knowledge/database/b-tree-index/',
                excerpt: prefix + ' ' + query + ' 문맥',
                plain_excerpt: prefix + ' ' + query + ' 문맥',
                meta: { title: prefix + ' ' + query, type: '지식', category: 'Computer Science' }
              };
            }
          }]
        };
      }
    `,
  }));
}

async function waitForSearchCalls(page: Page, count: number) {
  await page.waitForFunction((expected) => (
    (window as typeof window & { __pagefindSearchCalls?: string[] }).__pagefindSearchCalls?.length === expected
  ), count);
}

test('opens Korean search with the command shortcut and restores focus on Escape', async ({ page }) => {
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  const trigger = page.getByRole('button', { name: '통합 검색 열기' });

  await trigger.focus();
  await page.keyboard.press('ControlOrMeta+k');

  const dialog = page.getByRole('dialog', { name: '통합 검색' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('searchbox', { name: '지식 전체 검색' })).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '검색 닫기' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('searchbox', { name: '지식 전체 검색' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'visible');

  const headerTrigger = page.getByRole('button', { name: '검색 열기', exact: true });
  await headerTrigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(headerTrigger).toBeFocused();
});

test('finds the Korean B-Tree document and supports result keyboard navigation', async ({ page }) => {
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByRole('searchbox', { name: '지식 전체 검색' });

  await input.fill('B-Tree');
  const result = page.getByRole('option').first();
  await expect(result).toBeVisible();
  await expect(result).toContainText('지식');
  await expect(result).toContainText('컴퓨터 과학');
  await expect(result.locator('.search-result__excerpt')).not.toContainText('작성2026');

  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('option').last()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(result).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/knowledge\/database\/b-tree-index\/$/);
});

test('waits until Korean composition ends before searching', async ({ page }) => {
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByRole('searchbox', { name: '지식 전체 검색' });

  await input.evaluate((element) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '디' }));
  });
  await input.evaluate((element) => {
    const inputElement = element as HTMLInputElement;
    inputElement.value = '디스크';
    inputElement.dispatchEvent(new InputEvent('input', { bubbles: true, data: '디스크', isComposing: true }));
  });
  await page.waitForTimeout(180);
  const dialog = page.getByRole('dialog', { name: '통합 검색' });
  await expect(dialog.getByRole('status')).toContainText('검색어를 입력');

  await input.evaluate((element) => {
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '디스크' }));
  });
  await expect(page.getByRole('option').first()).toBeVisible();
});

test('uses an accessible full-screen search surface on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '통합 검색' });

  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(389);
  expect(box!.height).toBeGreaterThanOrEqual(843);

  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations).toEqual([]);
});

test('restores mobile search focus to the visible menu trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  const menuTrigger = page.getByRole('button', { name: '모바일 메뉴 열기' });

  await menuTrigger.click();
  await page.getByRole('button', { name: '검색 열기', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '통합 검색' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: '지식 전체 검색' })).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(menuTrigger).toBeFocused();
});

test('invalidates an in-flight result immediately when the query is cleared', async ({ page }) => {
  await mockSequencedPagefind(page, [220]);
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '통합 검색' });
  const input = dialog.getByRole('searchbox');

  await input.fill('A');
  await waitForSearchCalls(page, 1);
  await input.fill('');
  await page.waitForTimeout(260);

  await expect(dialog.getByRole('option')).toHaveCount(0);
  await expect(dialog.getByRole('status')).toContainText('검색어를 입력');
});

test('keeps a stale result out while the next query waits for debounce', async ({ page }) => {
  await mockSequencedPagefind(page, [80, 10]);
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '통합 검색' });
  const input = dialog.getByRole('searchbox');

  await input.fill('A');
  await waitForSearchCalls(page, 1);
  await input.fill('B');
  await page.waitForTimeout(100);

  await expect(dialog.getByRole('option')).toHaveCount(0);
  await expect(dialog.getByRole('status')).toContainText('검색 중입니다');
  await expect(dialog.getByRole('option', { name: /최신 B/ })).toBeVisible();
});

test('distinguishes repeated query text from an older request', async ({ page }) => {
  await mockSequencedPagefind(page, [280, 10]);
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '통합 검색' });
  const input = dialog.getByRole('searchbox');

  await input.fill('A');
  await waitForSearchCalls(page, 1);
  await input.fill('B');
  await input.fill('A');
  await waitForSearchCalls(page, 2);
  await expect(dialog.getByRole('option', { name: /최신 A/ })).toBeVisible();
  await page.waitForTimeout(300);

  await expect(dialog.getByRole('option', { name: /최신 A/ })).toBeVisible();
  await expect(dialog.getByRole('status')).toHaveCount(0);
});

test('invalidates an in-flight result when Korean composition starts', async ({ page }) => {
  await mockSequencedPagefind(page, [300, 10]);
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '통합 검색' });
  const input = dialog.getByRole('searchbox');

  await input.fill('A');
  await waitForSearchCalls(page, 1);
  await input.evaluate((element) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '디' }));
  });
  await page.waitForTimeout(350);

  await expect(dialog.getByRole('option')).toHaveCount(0);
  await input.evaluate((element) => {
    const inputElement = element as HTMLInputElement;
    inputElement.value = '디스크';
    inputElement.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '디스크' }));
  });
  await expect(dialog.getByRole('option', { name: /최신 디스크/ })).toBeVisible();
});

test('shows the Korean unavailable state when the build sentinel is present', async ({ page }) => {
  await page.route('**/pagefind/unavailable.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{"available":false}',
  }));
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');

  await page.getByRole('searchbox', { name: '지식 전체 검색' }).fill('데이터');

  await expect(page.getByRole('dialog', { name: '통합 검색' }).getByRole('status'))
    .toContainText('검색을 사용할 수 없습니다');
});

test('announces loading and an empty result in Korean', async ({ page }) => {
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '통합 검색' });

  await dialog.getByRole('searchbox').fill('존재하지않는검색어');
  await expect(dialog.getByRole('status')).toContainText('검색 중입니다');
  await expect(dialog.getByRole('status')).toContainText('일치하는 지식을 찾지 못했습니다');
});

test('announces a Pagefind loading error in Korean', async ({ page }) => {
  await page.route('**/pagefind/pagefind.js', (route) => route.abort());
  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '통합 검색' });

  await dialog.getByRole('searchbox').fill('디스크');

  await expect(dialog.getByRole('status')).toContainText('검색 중 문제가 생겼습니다');
});

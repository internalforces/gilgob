import { expect, test } from '@playwright/test';
import { pagePath } from './helpers';

const portfolioPath = pagePath('/portfolio/8c5e1a7d3b92-signal-hub/');
const koreanMobileNumberPattern = /(?:^|[^0-9])010(?:[ -]?[0-9]{4}){2}(?![0-9])/;

test('shows candidate, project value and four evidence metrics', async ({ page }) => {
  await page.goto(portfolioPath, { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', {
    level: 1,
    name: '재현 가능한 데이터 처리를 실제 배포까지 연결했습니다.',
  })).toBeVisible();
  await expect(page.getByText('손명관').first()).toBeVisible();
  await expect(page.getByText('백엔드 개발자').first()).toBeVisible();
  await expect(page.locator('.portfolio-metrics > *')).toHaveCount(4);
  await expect(page.locator('.portfolio-screen')).toHaveCount(2);
  expect(await page.locator('body').innerText()).not.toMatch(koreanMobileNumberPattern);
});

test('opens the browser print dialog from the toolbar', async ({ page }) => {
  await page.goto(portfolioPath);
  await page.evaluate(() => {
    (window as typeof window & { __printCalls?: number }).__printCalls = 0;
    window.print = () => {
      (window as typeof window & { __printCalls?: number }).__printCalls! += 1;
    };
  });

  await page.getByRole('button', { name: 'PDF로 저장' }).click();

  await expect.poll(() => page.evaluate(() => (
    (window as typeof window & { __printCalls?: number }).__printCalls
  ))).toBe(1);
});

test('activates the print control with Enter', async ({ page }) => {
  await page.goto(portfolioPath);
  await page.evaluate(() => {
    (window as typeof window & { __printCalls?: number }).__printCalls = 0;
    window.print = () => {
      (window as typeof window & { __printCalls?: number }).__printCalls! += 1;
    };
  });

  const printButton = page.getByRole('button', { name: 'PDF로 저장' });
  const toolbar = page.locator('.portfolio-toolbar');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toolbar.getByRole('link', { name: 'GitHub' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toolbar.getByRole('link', { name: 'tarmk0801@gmail.com' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(printButton).toBeFocused();
  await page.keyboard.press('Enter');

  await expect.poll(() => page.evaluate(() => (
    (window as typeof window & { __printCalls?: number }).__printCalls
  ))).toBe(1);
});

test('keeps only the two portfolio screens visible in print media', async ({ page }) => {
  await page.goto(portfolioPath, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  const directScreens = page.locator('.portfolio-print-sheet > .portfolio-screen');
  const screens = page.locator('.portfolio-screen');
  await expect(directScreens).toHaveCount(2);
  await expect(screens).toHaveCount(2);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(screens.nth(0)).toBeVisible();
  await expect(screens.nth(1)).toBeVisible();
  await expect(page.locator('.portfolio-toolbar')).toBeHidden();
  await expect(page.locator('.portfolio-detail')).toBeHidden();
  await expect(page.locator('.portfolio-contact')).toBeHidden();
});

test('keeps Korean headline words intact while allowing whole-word wrapping', async ({ page }) => {
  await page.goto(portfolioPath, { waitUntil: 'networkidle' });

  const wrapping = await page.locator('.portfolio-overview > h1').evaluate((headline) => {
    const style = getComputedStyle(headline);
    return {
      lineBreak: style.lineBreak,
      overflowWrap: style.overflowWrap,
      wordBreak: style.wordBreak,
    };
  });

  expect(wrapping.wordBreak).toBe('keep-all');
  expect(wrapping.lineBreak).toBe('strict');
  expect(wrapping.overflowWrap).toBe('break-word');
});

test('keeps both portfolio screen headings visible with reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();

  try {
    await page.goto(portfolioPath, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', {
      level: 1,
      name: '재현 가능한 데이터 처리를 실제 배포까지 연결했습니다.',
    })).toBeVisible();
    await expect(page.getByRole('heading', {
      level: 2,
      name: 'Signal Hub · 백엔드 포트폴리오',
    })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('has no horizontal overflow on desktop', async ({ page }) => {
  await page.goto(portfolioPath, { waitUntil: 'networkidle' });

  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  ))).toBe(true);
});

test('has no horizontal overflow at a 390px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(portfolioPath, { waitUntil: 'networkidle' });

  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  ))).toBe(true);
});

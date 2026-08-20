import { expect, test } from '@playwright/test';

const homeUrl = process.env.PLAYWRIGHT_TEST_BASE_URL
  ?? 'http://127.0.0.1:4321/astro-astro-personal-knowledge-base-digital/';

test('home card links remain keyboard focusable before their scroll reveal', async ({ page }) => {
  await page.goto(homeUrl, { waitUntil: 'networkidle' });
  const cardsWithLinks = page.locator('[data-home-card]:has(a[href]), a[data-home-card][href]');

  const initialState = await cardsWithLinks.evaluateAll((cards) => cards.map((card) => ({
    visibility: getComputedStyle(card).visibility,
    opacity: Number(getComputedStyle(card).opacity),
    focusable: card.matches('a[href]')
      ? (card as HTMLAnchorElement).tabIndex >= 0
      : (card.querySelector('a[href]') as HTMLAnchorElement | null)?.tabIndex === 0,
  })));
  expect(initialState.length).toBeGreaterThan(0);
  expect(initialState.every((state) => (
    state.visibility === 'visible' && state.opacity > 0 && state.focusable
  ))).toBe(true);

  let focusedCard = false;
  for (let index = 0; index < 30 && !focusedCard; index += 1) {
    await page.keyboard.press('Tab');
    focusedCard = await page.evaluate(() => document.activeElement?.closest('[data-home-card]') !== null);
  }
  expect(focusedCard).toBe(true);

  const focusedState = await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const card = document.activeElement?.closest('[data-home-card]');
    if (!(card instanceof HTMLElement)) return false;
    const style = getComputedStyle(card);
    return style.visibility === 'visible'
      && Number(style.opacity) === 1
      && (style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)');
  });
  expect(focusedState).toBe(true);
});

test('home exposes source-accurate progress and Korean project metadata', async ({ page }) => {
  await page.goto(homeUrl, { waitUntil: 'networkidle' });

  await expect(page.getByRole('progressbar', { name: '공개 지식 문서 상태 기반 스킬 신호' })).toBeAttached();
  const metadata = page.locator('.project-card__meta').first();
  await expect(metadata).toContainText('구축 중');
  await expect(metadata).toContainText('프로젝트');
  await expect(metadata).not.toContainText('Projects');
});

test.describe('reduced motion', () => {
  test('renders every home card in its final visible state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(homeUrl, { waitUntil: 'networkidle' });
    const states = await page.locator('[data-home-card]').evaluateAll((cards) => cards.map((card) => {
      const style = getComputedStyle(card);
      return { visibility: style.visibility, opacity: Number(style.opacity), transform: style.transform };
    }));

    expect(states.every((state) => state.visibility === 'visible' && state.opacity === 1)).toBe(true);
  });
});

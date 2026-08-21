import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pagePath } from './helpers';

const homeUrl = pagePath('/');

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

test('home exposes YAML skill progress and Korean project metadata', async ({ page }) => {
  await page.goto(homeUrl, { waitUntil: 'networkidle' });

  await expect(page.getByRole('progressbar', { name: '스킬 트리 기준 전체 스킬 진척도' })).toBeAttached();
  const metadata = page.locator('.project-card__meta').first();
  await expect(metadata).toContainText('유지 중');
  await expect(metadata).toContainText('프로젝트');
  await expect(metadata).not.toContainText('Projects');
});

test('home keeps every generated GitHub state safe, Korean, and accessible', async ({ page }) => {
  await page.goto(homeUrl, { waitUntil: 'networkidle' });

  const section = page.locator('[data-github-activity]');
  await expect(section.getByRole('heading', { name: 'GitHub 활동' })).toBeVisible();
  await expect(section).toHaveAttribute('data-state', /^(ready|stale|empty)$/);
  const state = await section.getAttribute('data-state');
  const profileLink = section.getByRole('link', { name: /GitHub 프로필 보기/ });
  await expect(profileLink).toHaveAttribute(
    'href',
    'https://github.com/internalforces',
  );
  await expect(profileLink).toHaveAttribute('target', '_blank');
  await expect(profileLink).toHaveAttribute('rel', /\bnoreferrer\b/);

  if (state === 'empty') {
    await expect(section.getByRole('status')).toHaveText('GitHub 통계를 불러오지 못했습니다.');
    await expect(section.locator('.github-activity__grid')).toHaveCount(0);
  } else {
    await expect(section.getByRole('group', { name: /지난 1년 GitHub 기여 합계 \d+회/ })).toBeAttached();
    await expect(section.getByRole('table', { name: '날짜별 GitHub 기여 횟수', includeHidden: true })).toBeAttached();
    await expect(section.getByRole('heading', { name: '최근 공개 활동' })).toBeVisible();
    if (state === 'stale') {
      await expect(section.getByRole('status')).toContainText('마지막으로 확인된 활동 · ');
    } else {
      await expect(section.getByRole('status')).toHaveCount(0);
    }
  }

  const links = await section.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => {
    const link = anchor as HTMLAnchorElement;
    return { href: link.href, rel: link.rel, target: link.target };
  }));
  expect(links.length).toBeGreaterThan(0);
  expect(links.every(({ href, rel, target }) => {
    const url = new URL(href);
    return url.protocol === 'https:'
      && url.hostname === 'github.com'
      && url.port === ''
      && url.username === ''
      && url.password === ''
      && target === '_blank'
      && rel.split(/\s+/).includes('noreferrer');
  })).toBe(true);

  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const results = await new AxeBuilder({ page }).include('[data-github-activity]').analyze();
    expect(results.violations).toEqual([]);
  }
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

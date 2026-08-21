import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readContentIndex } from '../../src/lib/content/index-store';
import { categoryLabel } from '../../src/lib/content/taxonomy';
import { pagePath } from './helpers';

const graphUrl = pagePath('/graph/');

test('mounts the graph only on its route and exposes real keyboard node controls', async ({ page }) => {
  const cytoscapeRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().toLowerCase().includes('cytoscape')) cytoscapeRequests.push(request.url());
  });

  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  expect(cytoscapeRequests).toEqual([]);
  await expect(page.locator('[data-graph-canvas]')).toHaveCount(0);

  await page.goto(graphUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('[data-graph-canvas] canvas').first()).toBeAttached();

  const bTreeControl = page.getByRole('button', { name: /B-Tree는 왜 DB Index에 사용될까/ });
  await bTreeControl.focus();
  await page.keyboard.press('Enter');
  await expect(bTreeControl).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: '선택한 노드 상세' })).toContainText('B-Tree는 왜 DB Index에 사용될까?');
  await expect(page.getByRole('link', { name: '문서 읽기' })).toHaveAttribute(
    'href',
    pagePath('/knowledge/database/b-tree-index'),
  );
});

test('supports multiple facets and clears a selection removed by filtering', async ({ page }) => {
  await page.goto(graphUrl, { waitUntil: 'networkidle' });

  const bTreeControl = page.getByRole('button', { name: /B-Tree는 왜 DB Index에 사용될까/ });
  await bTreeControl.click();
  await page.getByRole('group', { name: /분야/ }).getByRole('checkbox', { name: /프로젝트/ }).check();

  await expect(page.getByText('활성 필터 1개')).toBeVisible();
  await expect(page.getByRole('button', { name: /B-Tree는 왜 DB Index에 사용될까/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: '선택한 노드 상세' })).toContainText('Signal Hub');

  await page.getByRole('group', { name: /태그/ }).getByRole('checkbox', { name: /TypeScript/ }).check();
  await expect(page.getByText('활성 필터 2개')).toBeVisible();
  await expect(page.getByText('문서 1개 · 노드')).toBeVisible();
});

test('has no automatically detectable accessibility violations on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(graphUrl, { waitUntil: 'networkidle' });

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('uses a reduced-motion mobile ego graph and passes automated accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(graphUrl, { waitUntil: 'networkidle' });

  await expect(page.locator('[data-graph-mode]')).toHaveAttribute('data-graph-mode', 'ego');
  await expect(page.locator('[data-graph-motion]')).toHaveAttribute('data-graph-motion', 'reduced');
  await expect(page.locator('[data-graph-canvas]')).toHaveAttribute('data-graph-initialized-mode', 'ego');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('stops the active layout before rebuilding across the mobile breakpoint', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('wheel sensitivity')) {
      runtimeErrors.push(message.text());
    }
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(graphUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('[data-graph-canvas] canvas').first()).toBeAttached();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-graph-mode]')).toHaveAttribute('data-graph-mode', 'ego');
  await page.waitForTimeout(400);

  expect(runtimeErrors).toEqual([]);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps every public document and complete incoming/outgoing links accessible', async ({ page }) => {
    await page.goto(graphUrl);

    const documents = readContentIndex().documents.filter((document) => !document.draft);
    const fallback = page.getByRole('group', { name: '그래프 대신 목록 보기' });
    await expect(fallback).toBeVisible();
    await expect(fallback.getByRole('article').getByRole('heading', { level: 3 })).toHaveCount(documents.length);
    await expect(fallback.getByText('나가는 연결')).toHaveCount(documents.length);
    await expect(fallback.getByText('들어오는 연결')).toHaveCount(documents.length);
    for (const document of documents) {
      const article = fallback.getByRole('article').filter({
        has: page.locator('h3').getByRole('link', { name: document.title, exact: true }),
      });
      await expect(article).toHaveCount(1);
      await expect(article.getByText(document.category, { exact: true })).toHaveCount(0);
      const categoryGroup = fallback.getByRole('heading', {
        level: 3,
        name: `분야: ${categoryLabel(document.category)}`,
      });
      const categoryId = await categoryGroup.getAttribute('id');
      expect(categoryId).not.toBeNull();
      const categoryLink = article.getByRole('link', { name: /분야:/ });
      await expect(categoryLink).toHaveAttribute('href', pagePath(`/graph/#${categoryId}`));
      await page.goto(pagePath(`/graph/#${categoryId}`));
      await expect(page.locator(':target')).toHaveText(`분야: ${categoryLabel(document.category)}`);
      const categoryGroupItem = categoryGroup.locator('..');
      await expect(categoryGroupItem.getByRole('link', { name: document.title, exact: true })).toHaveCount(1);
      for (const tag of document.tags) {
        const tagGroup = fallback.getByRole('heading', {
          level: 3,
          name: `태그: #${tag}`,
          exact: true,
        });
        const tagId = await tagGroup.getAttribute('id');
        expect(tagId).not.toBeNull();
        const tagLink = article.getByRole('link', { name: `#${tag}`, exact: true });
        await expect(tagLink).toHaveAttribute('href', pagePath(`/graph/#${tagId}`));
        await page.goto(pagePath(`/graph/#${tagId}`));
        await expect(page.locator(':target')).toHaveText(`태그: #${tag}`);
        await expect(tagGroup.locator('..').getByRole('link', { name: document.title, exact: true })).toHaveCount(1);
      }
    }
  });
});

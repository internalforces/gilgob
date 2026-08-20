import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
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
  await page.getByRole('checkbox', { name: /Projects/ }).check();

  await expect(page.getByText('활성 필터 1개')).toBeVisible();
  await expect(page.getByRole('button', { name: /B-Tree는 왜 DB Index에 사용될까/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: '선택한 노드 상세' })).toContainText('Signal Hub');

  await page.getByRole('checkbox', { name: /Knowledge Garden/ }).check();
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

    const fallback = page.getByRole('group', { name: '그래프 대신 목록 보기' });
    await expect(fallback).toBeVisible();
    await expect(fallback.getByRole('heading', { level: 3 })).toHaveCount(4);
    await expect(fallback.getByRole('link', { name: 'B-Tree는 왜 DB Index에 사용될까?' })).not.toHaveCount(0);
    await expect(fallback.getByText('나가는 연결')).toHaveCount(4);
    await expect(fallback.getByText('들어오는 연결')).toHaveCount(4);
  });
});

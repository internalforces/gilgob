import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

test('base layout exposes Korean navigation and accessibility hooks', async () => {
  const source = await readFile('src/layouts/BaseLayout.astro', 'utf8');

  expect(source).toContain('lang="ko"');
  expect(source).toContain('본문 바로가기');
  expect(source).toContain('prefers-reduced-motion');
  expect(source).toContain('gilgob');
});

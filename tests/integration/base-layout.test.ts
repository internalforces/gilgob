import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

test('base layout exposes Korean navigation and accessibility hooks', async () => {
  const source = await readFile('src/layouts/BaseLayout.astro', 'utf8');

  expect(source).toContain('lang="ko"');
  expect(source).toContain('본문 바로가기');
  expect(source).toContain('prefers-reduced-motion');
  expect(source).toContain('gilgob');
});

test('base layout loads the bundled Geist variable font', async () => {
  const [layout, packageJson] = await Promise.all([
    readFile('src/layouts/BaseLayout.astro', 'utf8'),
    readFile('package.json', 'utf8').then((source) => JSON.parse(source)),
  ]);

  expect(layout).toContain("import '@fontsource-variable/geist';");
  expect(packageJson.dependencies['@fontsource-variable/geist']).toBeDefined();
});

test('base layout supports unlisted pages', async () => {
  const source = await readFile('src/layouts/BaseLayout.astro', 'utf8');

  expect(source).toContain('robots?: string');
  expect(source).toContain('searchable?: boolean');
  expect(source).toContain("data-pagefind-ignore={searchable ? undefined : 'all'}");
});

test('global styles preserve the Geist body font while controls inherit it', async () => {
  const source = await readFile('src/styles/global.css', 'utf8');

  expect(source).toMatch(/body\s*\{[\s\S]*?font-family: 'Geist Variable'/);
  expect(source).not.toMatch(/body,\s*\nbutton,/);
  expect(source).toMatch(/button,\s*\ninput,\s*\ntextarea,\s*\nselect\s*\{\s*font: inherit;/);
});

test('callout labels use the dark shared text token', async () => {
  const source = await readFile('src/styles/content.css', 'utf8');
  const labelRules = [...source.matchAll(/\.prose [^{]*\.callout__label[^{]*\{([^}]*)\}/g)];

  expect(labelRules).toHaveLength(1);
  expect(labelRules[0][1]).toContain('color: var(--ink);');
});

test('focus rings use the full-strength primary token', async () => {
  const source = await readFile('src/styles/global.css', 'utf8');

  expect(source).toMatch(/:focus-visible\s*\{[^}]*outline: 3px solid var\(--primary\);/s);
});

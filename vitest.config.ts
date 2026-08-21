import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'preact' },
  },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'tests/e2e/**', '.worktrees/**'],
  },
});
